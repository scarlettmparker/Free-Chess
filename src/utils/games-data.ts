import { defineLoader } from '@sun/ssr';
import { executeDocument, getCookieValue } from '@sun/api';
import {
  GameSupportDocument,
  GetGameDocument,
  LobbySupportDocument,
  MyGamesDocument,
  type GameSupportQuery,
  type GetGameQuery,
  type LobbySupportQuery,
  type MyGamesQuery,
} from '~/generated/graphql';
import { AUTH_COOKIE } from '~/utils/auth';
import { createGameToken } from '~/server/game-token';
import {
  getGame,
  listMoves,
  listOpenGames,
  type GameDto,
  type GameOutcome,
  type GameStatus,
} from '~/server/games';
import type { SerializedGameState } from '~/utils/game-serialize';
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
  record: MyGamesQuery['medusaQueries']['myGames']['record'];
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
 * Maps player usernames by account id.
 *
 * @param players Players to map.
 * @returns Usernames keyed by account id.
 */
function playerNames(players: Array<{ id: string; username: string }>): Map<string, string> {
  return new Map(players.map((player) => [player.id, player.username]));
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
 * Loads the lobby layouts and the open games.
 */
defineLoader({
  pattern: 'lobby',
  async loader(_params, context) {
    const token = getCookieValue(context.cookie, AUTH_COOKIE);
    const open = listOpenGames();
    const ids = [
      ...new Set(
        open.flatMap((game) =>
          [game.whiteAccountId, game.blackAccountId].filter((id): id is string => id !== null),
        ),
      ),
    ];

    const support = await executeDocument<LobbySupportQuery>(LobbySupportDocument, { ids }, token);
    const layouts = support.success
      ? (support.data?.medusaQueries.boardLayouts ?? []).map((layout) => ({
          id: layout.id,
          name: layout.name,
          description: layout.description ?? null,
        }))
      : [];
    const usernames = playerNames(support.data?.medusaQueries.players ?? []);
    const user = support.data?.gaiaQueries.me ?? null;

    if (!user) {
      return { lobby: { layouts, games: [], signedIn: false } as LobbyData };
    }

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
    const cookieToken = getCookieValue(context.cookie, AUTH_COOKIE);
    const game = id ? getGame(id) : null;

    if (!game) {
      const result = await executeDocument<GetGameQuery>(
        GetGameDocument,
        { code: id },
        cookieToken,
      );
      const archived = result.success ? result.data?.medusaQueries.game : null;
      if (!archived) return { game: null };

      const data: PlayGameData = {
        id: archived.code,
        status: archived.status as GameStatus,
        result: archived.result as GameOutcome | null,
        boardLayoutName: archived.boardLayoutName,
        initial: archived.initialState as SerializedGameState,
        moves: archived.moves.map((move) => move.move),
        whiteAccountId: archived.whiteAccountId,
        blackAccountId: archived.blackAccountId,
        whiteUsername: archived.whitePlayer?.username ?? null,
        blackUsername: archived.blackPlayer?.username ?? null,
        viewerSeat: archived.viewerSeat as GameViewerSeat,
        token: null,
      };

      return { game: data };
    }

    const ids = [game.whiteAccountId, game.blackAccountId].filter(
      (accountId): accountId is string => accountId !== null,
    );
    const support = cookieToken
      ? await executeDocument<GameSupportQuery>(GameSupportDocument, { ids }, cookieToken)
      : null;
    const user = support?.data?.gaiaQueries.me ?? null;
    const usernames = playerNames(support?.data?.medusaQueries.players ?? []);
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
  async loader(params, context) {
    const id = typeof params.id === 'string' ? params.id : '';
    if (!id) return { replay: null };

    const token = getCookieValue(context.cookie, AUTH_COOKIE);
    const result = await executeDocument<GetGameQuery>(GetGameDocument, { code: id }, token);
    const game = result.success ? result.data?.medusaQueries.game : null;
    if (!game || !game.finalState) return { replay: null };

    const data: ReplayGameData = {
      id: game.code,
      status: game.status as GameStatus,
      result: game.result as GameOutcome | null,
      boardLayoutName: game.boardLayoutName,
      initial: game.initialState as SerializedGameState,
      moves: game.moves.map((move) => move.move),
      whiteUsername: game.whitePlayer?.username ?? null,
      blackUsername: game.blackPlayer?.username ?? null,
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
    const token = getCookieValue(context.cookie, AUTH_COOKIE);
    if (!token) return { gameHistory: emptyHistory(pageIndex) };

    const result = await executeDocument<MyGamesQuery>(
      MyGamesDocument,
      { pagination: { page: pageIndex, size: 10 } },
      token,
    );
    const page = result.success ? result.data?.medusaQueries.myGames : null;
    if (!page) return { gameHistory: emptyHistory(pageIndex) };

    const games: GameHistoryEntry[] = page.items.map((game) => ({
      id: game.code,
      status: game.status as GameStatus,
      result: game.result as GameOutcome | null,
      boardLayoutName: game.boardLayoutName,
      whiteUsername: game.whitePlayer?.username ?? null,
      blackUsername: game.blackPlayer?.username ?? null,
      viewerSeat: game.viewerSeat as GameViewerSeat,
      finalState: game.finalState as SerializedGameState,
      score: scoreFor(game.result as GameOutcome | null),
      createdAt: game.createdAt,
      finishedAt: game.finishedAt,
    }));

    return {
      gameHistory: {
        games,
        total: page.pageInfo.totalCount,
        page: page.pageInfo.page,
        pageSize: page.pageInfo.size,
        totalPages: page.pageInfo.totalPages,
        record: page.record,
      } as GameHistoryData,
    };
  },
});
