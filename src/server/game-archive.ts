import type { GameArchiveInput } from '~/generated/graphql';
import type { GameDto, GameMoveDto } from '~/server/games';
import type { SerializedGameState } from '~/utils/game-serialize';

type GameArchiveSource = {
  /**
   * Stored live game.
   */
  game: GameDto;
  /**
   * Stored live moves.
   */
  moves: GameMoveDto[];
  /**
   * Final engine snapshot.
   */
  finalState: SerializedGameState;
  /**
   * Sun board layout id when known.
   */
  boardLayoutId?: string | null;
};

/**
 * Builds the payload that archives a finished game.
 *
 * @param source Live game data.
 * @returns Archive mutation input.
 */
export function buildGameArchiveInput(source: GameArchiveSource): GameArchiveInput {
  const { game, moves, finalState, boardLayoutId = null } = source;
  if (!game.finishedAt) {
    throw new Error('Cannot archive a game without a finish time');
  }

  return {
    code: game.id,
    boardLayoutId,
    boardLayoutName: game.boardLayoutName ?? 'Standard',
    initialState: game.initialState,
    finalState,
    creatorAccountId: game.creatorAccountId,
    whiteAccountId: game.whiteAccountId,
    blackAccountId: game.blackAccountId,
    result: game.result,
    winnerAccountId: game.winnerAccountId,
    createdAt: game.createdAt,
    startedAt: game.startedAt,
    finishedAt: game.finishedAt,
    moves: moves.map((move) => ({
      ply: move.ply,
      move: move.move,
      playedAt: move.playedAt,
    })),
  };
}
