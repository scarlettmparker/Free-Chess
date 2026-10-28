import { defineLoader } from '@sun/ssr';
import { executeDocument, getCookieValue } from '@sun/api';
import {
  GetAccountDocument,
  ListBoardLayoutsDocument,
  type GetAccountQuery,
  type ListBoardLayoutsQuery,
} from '~/generated/graphql';
import { AUTH_COOKIE, getCurrentUser } from '~/utils/auth';
import { gameState } from '~/game/consts/board';
import { createGameToken } from '~/server/game-token';
import {
  countResultsForAccount,
  getGame,
  listGamesForAccount,
  listMoves,
  type AccountGameRecord,
  type GameDto,
  type GameOutcome,
  type GameStatus,
} from '~/server/games';
import { replayGameMoves } from '~/utils/game-replay';
import { serializeGameState, type SerializedGameState } from '~/utils/game-serialize';
import { clientSecret } from '../../config.js';

/**
 * Board layout option shown in the lobby.
 */
export type LobbyLayout = {
  /**
   * Sun board layout id.
   */
  id: string;
  /**
   * Layout name.
   */
  name: string;
  /**
   * Layout description.
   */
  description: string | null;
};

/**
 * Game summary shown in the lobby.
 */
export type LobbyGame = {
  /**
   * Game id.
   */
  id: string;
  /**
   * Lifecycle state.
   */
  status: GameStatus;
  /**
   * Board layout name.
   */
  boardLayoutName: string | null;
  /**
   * Creation timestamp.
   */
  createdAt: string;
  /**
   * Username holding white.
   */
  whiteUsername: string | null;
  /**
   * Username holding black.
   */
  blackUsername: string | null;
  /**
   * Seat held by the viewer.
   */
  viewerSeat: GameViewerSeat;
};

/**
 * Lobby page data.
 */
export type LobbyData = {
  /**
   * Available board layouts.
   */
  layouts: LobbyLayout[];
  /**
   * Open games for the signed-in account.
   */
  games: LobbyGame[];
  /**
   * Whether the viewer is signed in.
   */
  signedIn: boolean;
};

/**
 * Seat held by the page viewer.
 */
export type GameViewerSeat = 'white' | 'black' | 'creator' | 'spectator';

/**
 * Live game page data.
 */
export type PlayGameData = {
  /**
   * Game id.
   */
  id: string;
  /**
   * Lifecycle state.
   */
  status: GameStatus;
  /**
   * Final result.
   */
  result: GameOutcome | null;
  /**
   * Board layout name.
   */
  boardLayoutName: string | null;
  /**
   * Starting position.
   */
  initial: SerializedGameState;
  /**
   * Encoded moves in ply order.
   */
  moves: number[];
  /**
   * Account holding white.
   */
  whiteAccountId: string | null;
  /**
   * Account holding black.
   */
  blackAccountId: string | null;
  /**
   * Username holding white.
   */
  whiteUsername: string | null;
  /**
   * Username holding black.
   */
  blackUsername: string | null;
  /**
   * Seat held by the viewer.
   */
  viewerSeat: GameViewerSeat;
  /**
   * Signed token for the room socket.
   */
  token: string | null;
};

/**
 * Replay page data.
 */
export type ReplayGameData = {
  /**
   * Game id.
   */
  id: string;
  /**
   * Lifecycle state.
   */
  status: GameStatus;
  /**
   * Final result.
   */
  result: GameOutcome | null;
  /**
   * Board layout name.
   */
  boardLayoutName: string | null;
  /**
   * Starting position.
   */
  initial: SerializedGameState;
  /**
   * Encoded moves in ply order.
   */
  moves: number[];
  /**
   * Username holding white.
   */
  whiteUsername: string | null;
  /**
   * Username holding black.
   */
  blackUsername: string | null;
  /**
   * Creation timestamp.
   */
  createdAt: string;
  /**
   * Finish timestamp.
   */
  finishedAt: string | null;
};

/**
 * One game history entry.
 */
export type GameHistoryEntry = {
  /**
   * Game id.
   */
  id: string;
  /**
   * Lifecycle state.
   */
  status: GameStatus;
  /**
   * Final result.
   */
  result: GameOutcome | null;
  /**
   * Board layout name.
   */
  boardLayoutName: string | null;
  /**
   * Username holding white.
   */
  whiteUsername: string | null;
  /**
   * Username holding black.
   */
  blackUsername: string | null;
  /**
   * Seat held by the viewer.
   */
  viewerSeat: GameViewerSeat;
  /**
   * Final position for the card preview.
   */
  finalState: SerializedGameState;
  /**
   * Display score.
   */
  score: string;
  /**
   * Creation timestamp.
   */
  createdAt: string;
  /**
   * Finish timestamp.
   */
  finishedAt: string | null;
};

/**
 * Profile game history page data.
 */
export type GameHistoryData = {
  /**
   * Games on this page.
   */
  games: GameHistoryEntry[];
  /**
   * Total games for the account.
   */
  total: number;
  /**
   * Zero based page index.
   */
  page: number;
  /**
   * Page size.
   */
  pageSize: number;
  /**
   * Total number of pages.
   */
  totalPages: number;
  /**
   * Win loss and draw totals.
   */
  record: AccountGameRecord;
};

/**
 * Empty history page.
 *
 * @param page Zero based page index.
 * @returns Empty history data.
 */
function emptyHistory(page: number): GameHistoryData {
  return {
    games: [],
    total: 0,
    page,
    pageSize: 10,
    totalPages: 1,
    record: { wins: 0, losses: 0, draws: 0, played: 0 },
  };
}

/**
 * Resolves usernames for a set of account ids.
 *
 * @param accountIds Account ids to resolve.
 * @returns Usernames keyed by account id.
 */
async function loadUsernames(accountIds: Array<string | null>): Promise<Map<string, string>> {
  const unique = [...new Set(accountIds.filter((id): id is string => Boolean(id)))];
  const entries = await Promise.all(
    unique.map(async (id) => {
      const result = await executeDocument<GetAccountQuery>(GetAccountDocument, { id });
      const username = result.success ? result.data?.gaiaQueries.account?.username : null;
      return [id, username ?? id] as const;
    }),
  );
  return new Map(entries);
}

/**
 * Resolves the seat held by the viewer.
 *
 * @param game Stored game.
 * @param accountId Viewer account id or null.
 * @returns Seat held by the viewer.
 */
function viewerSeat(game: GameDto, accountId: string | null): GameViewerSeat {
  if (!accountId) return 'spectator';
  if (game.whiteAccountId === accountId) return 'white';
  if (game.blackAccountId === accountId) return 'black';
  if (
    game.status === 'waiting' &&
    game.creatorAccountId === accountId &&
    game.whiteAccountId === null &&
    game.blackAccountId === null
  ) {
    return 'creator';
  }
  return 'spectator';
}

/**
 * Builds the display score for a game.
 *
 * @param result Engine result.
 * @returns Score string.
 */
function scoreFor(result: GameOutcome | null): string {
  if (result === 'white-checkmate') return '1–0';
  if (result === 'black-checkmate') return '0–1';
  if (result === 'draw' || result === 'stalemate') return '½–½';
  return '';
}

/**
 * Reads the signed-in account from a cookie.
 *
 * @param cookie Raw cookie header.
 * @returns Account or null.
 */
async function currentAccount(cookie: string | undefined) {
  const token = getCookieValue(cookie, AUTH_COOKIE);
  return getCurrentUser(token);
}

/**
 * Loads the lobby layouts and the viewer's open games.
 */
defineLoader({
  pattern: 'lobby',
  async loader(_params, context) {
    const layoutsResult = await executeDocument<ListBoardLayoutsQuery>(ListBoardLayoutsDocument);
    const layouts = layoutsResult.success
      ? (layoutsResult.data?.medusaQueries.boardLayouts ?? []).map((layout) => ({
          id: String(layout.id),
          name: layout.name,
          description: layout.description ?? null,
        }))
      : [];

    const user = await currentAccount(context.cookie);
    if (!user) {
      return { lobby: { layouts, games: [], signedIn: false } as LobbyData };
    }

    const page = listGamesForAccount(user.id, 0, 50);
    const open = page.games.filter((game) => game.status !== 'finished');
    const usernames = await loadUsernames(
      open.flatMap((game) => [game.whiteAccountId, game.blackAccountId]),
    );

    const games: LobbyGame[] = open.map((game) => ({
      id: game.id,
      status: game.status as GameStatus,
      boardLayoutName: game.boardLayoutName,
      createdAt: game.createdAt,
      whiteUsername: game.whiteAccountId
        ? (usernames.get(game.whiteAccountId) ?? game.whiteAccountId)
        : null,
      blackUsername: game.blackAccountId
        ? (usernames.get(game.blackAccountId) ?? game.blackAccountId)
        : null,
      viewerSeat: viewerSeat(game, user.id),
    }));

    return { lobby: { layouts, games, signedIn: true } as LobbyData };
  },
});

/**
 * Loads one live game.
 */
defineLoader({
  pattern: 'game',
  async loader(params, context) {
    const id = typeof params.id === 'string' ? params.id : '';
    const game = id ? getGame(id) : null;
    if (!game) return { game: null };

    const user = await currentAccount(context.cookie);
    const usernames = await loadUsernames([game.whiteAccountId, game.blackAccountId]);
    const token =
      user && clientSecret
        ? createGameToken({ gameId: game.id, accountId: user.id }, clientSecret)
        : null;

    const data: PlayGameData = {
      id: game.id,
      status: game.status as GameStatus,
      result: game.result as GameOutcome | null,
      boardLayoutName: game.boardLayoutName,
      initial: game.initialState as SerializedGameState,
      moves: listMoves(game.id).map((entry) => entry.move),
      whiteAccountId: game.whiteAccountId,
      blackAccountId: game.blackAccountId,
      whiteUsername: game.whiteAccountId
        ? (usernames.get(game.whiteAccountId) ?? game.whiteAccountId)
        : null,
      blackUsername: game.blackAccountId
        ? (usernames.get(game.blackAccountId) ?? game.blackAccountId)
        : null,
      viewerSeat: viewerSeat(game, user?.id ?? null),
      token,
    };

    return { game: data };
  },
});

/**
 * Loads one stored game for replay.
 */
defineLoader({
  pattern: 'replay',
  async loader(params) {
    const id = typeof params.id === 'string' ? params.id : '';
    const game = id ? getGame(id) : null;
    if (!game) return { replay: null };

    const usernames = await loadUsernames([game.whiteAccountId, game.blackAccountId]);
    const data: ReplayGameData = {
      id: game.id,
      status: game.status as GameStatus,
      result: game.result as GameOutcome | null,
      boardLayoutName: game.boardLayoutName,
      initial: game.initialState as SerializedGameState,
      moves: listMoves(game.id).map((entry) => entry.move),
      whiteUsername: game.whiteAccountId
        ? (usernames.get(game.whiteAccountId) ?? game.whiteAccountId)
        : null,
      blackUsername: game.blackAccountId
        ? (usernames.get(game.blackAccountId) ?? game.blackAccountId)
        : null,
      createdAt: game.createdAt,
      finishedAt: game.finishedAt,
    };

    return { replay: data };
  },
});

/**
 * Loads game history for the signed-in account.
 */
defineLoader({
  pattern: 'gameHistory',
  async loader(params, context) {
    const pageIndex = Math.max(0, Number(params.page ?? 0) || 0);
    const user = await currentAccount(context.cookie);
    if (!user) return { gameHistory: emptyHistory(pageIndex) };

    const page = listGamesForAccount(user.id, pageIndex, 10);
    const usernames = await loadUsernames(
      page.games.flatMap((game) => [game.whiteAccountId, game.blackAccountId]),
    );

    const games: GameHistoryEntry[] = page.games.map((game) => {
      const moves = listMoves(game.id).map((entry) => entry.move);
      replayGameMoves(game.initialState as SerializedGameState, moves, moves.length);
      return {
        id: game.id,
        status: game.status as GameStatus,
        result: game.result as GameOutcome | null,
        boardLayoutName: game.boardLayoutName,
        whiteUsername: game.whiteAccountId
          ? (usernames.get(game.whiteAccountId) ?? game.whiteAccountId)
          : null,
        blackUsername: game.blackAccountId
          ? (usernames.get(game.blackAccountId) ?? game.blackAccountId)
          : null,
        viewerSeat: viewerSeat(game, user.id),
        finalState: serializeGameState(gameState),
        score: scoreFor(game.result as GameOutcome | null),
        createdAt: game.createdAt,
        finishedAt: game.finishedAt,
      };
    });

    return {
      gameHistory: {
        games,
        total: page.total,
        page: page.page,
        pageSize: page.pageSize,
        totalPages: page.totalPages,
        record: countResultsForAccount(user.id),
      } as GameHistoryData,
    };
  },
});
