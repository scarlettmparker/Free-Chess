import type { GameArchiveInput } from '~/generated/graphql';
import type { GameDto } from '~/server/games';

type GameArchiveSource = {
  /**
   * Stored live game.
   */
  game: GameDto;
  /**
   * Stored live moves.
   */
  moves: GameDto['moves'];
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
  const { game, moves, boardLayoutId = null } = source;
  if (!game.finishedAt) {
    throw new Error('Cannot archive a game without a finish time');
  }
  if (!game.finalState) {
    throw new Error('Cannot archive a game without a final state');
  }

  return {
    code: game.code,
    boardLayoutId,
    boardLayoutName: game.boardLayoutName,
    initialState: game.initialState,
    finalState: game.finalState,
    creatorAccountId: game.creatorAccountId,
    whiteAccountId: game.whiteAccountId,
    blackAccountId: game.blackAccountId,
    result: game.result,
    winnerAccountId: game.winnerAccountId,
    createdAt: game.createdAt,
    startedAt: game.startedAt,
    finishedAt: game.finishedAt,
    moves,
  };
}
