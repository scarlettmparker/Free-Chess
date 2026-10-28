import { configureApi, executeDocument } from '@sun/api';
import { clientSecret, sunApiKey } from '../../config.js';
import { ArchiveGameDocument, type ArchiveGameMutation } from '~/generated/graphql';
import { buildGameArchiveInput } from '~/server/game-archive';
import {
  deleteGame,
  getGame,
  listMoves,
  markGameArchiveFailed,
  markGameArchivePending,
} from '~/server/games';

/**
 * Configures the Sun GraphQL client for the worker.
 */
export function configureSunApi() {
  configureApi({
    clientId: 'free-chess',
    clientSecret,
    apiKey: sunApiKey,
    appBaseUrl: process.env.BETTER_AUTH_URL || 'http://localhost:5179',
  });
}

/**
 * Archives one finished game in Sun and removes it from SQLite.
 *
 * @param gameId Game id.
 * @returns True when the game was archived and deleted.
 */
export async function archiveFinishedGame(gameId: string): Promise<boolean> {
  const game = getGame(gameId);
  if (!game || game.status !== 'finished') return false;

  markGameArchivePending(gameId);

  try {
    const input = buildGameArchiveInput({
      game,
      moves: listMoves(gameId),
    });
    const result = await executeDocument<ArchiveGameMutation>(
      ArchiveGameDocument,
      { input },
      undefined,
      { retries: [], timeoutMs: 5000 },
    );
    if (!result.success || !result.data?.medusaMutations.archiveGame.game) {
      throw new Error(result.error ?? 'Sun did not return an archived game');
    }

    deleteGame(gameId);
    console.info('Archived game', gameId);
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    markGameArchiveFailed(gameId, message);
    console.error('Game archive failed', gameId, error);
    return false;
  }
}
