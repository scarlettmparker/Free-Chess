import { archiveFinishedGame } from '~/server/game-archive-client';
import { listPendingArchiveIds } from '~/server/games';

/**
 * Default delay between archive retries.
 */
export const ARCHIVE_RETRY_MS = 30_000;

let running = false;

/**
 * Archives every finished game that is still in SQLite.
 */
export async function archivePendingGames() {
  if (running) return;
  running = true;

  try {
    for (const gameId of listPendingArchiveIds()) {
      await archiveFinishedGame(gameId);
    }
  } finally {
    running = false;
  }
}

/**
 * Starts the archive retry loop.
 *
 * @param intervalMs Delay between retries.
 * @returns Stop function.
 */
export function startArchiveWorker(intervalMs = ARCHIVE_RETRY_MS) {
  void archivePendingGames();
  const timer = setInterval(() => {
    void archivePendingGames();
  }, intervalMs);
  timer.unref();

  return () => clearInterval(timer);
}
