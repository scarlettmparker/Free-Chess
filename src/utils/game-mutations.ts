import { defineMutation, MutationError } from '@sun/ssr';
import { getCookieValue } from '@sun/api';
import { gameState } from '~/game/consts/board';
import { AUTH_COOKIE, getCurrentUser } from '~/utils/auth';
import { mountGame } from '~/utils';
import { serializeGameState } from '~/utils/game-serialize';
import { getLayout, listLayouts, loadLayout } from '~/server/board-layouts';
import { syncLayoutFromSun } from '~/server/board-layout-sync';
import { createGame as createStoredGame } from '~/server/games';

/**
 * Body accepted by the create game mutation.
 */
type CreateGameBody = {
  /**
   * Sun board layout id to use.
   */
  boardLayoutId?: string;
};

/**
 * Mounts the standard layout when it is available.
 *
 * @returns Layout id and name.
 */
function mountStandardLayout(): { id: number | null; name: string } {
  const standard = listLayouts().find((layout) => layout.slug === 'standard');
  const loaded = standard ? loadLayout(standard.id) : null;
  if (loaded) {
    mountGame(loaded);
  } else {
    mountGame();
  }
  return { id: standard?.id ?? null, name: standard?.name ?? 'Standard' };
}

/**
 * Creates an account game.
 */
defineMutation({
  path: 'game/create',
  async handler(body: CreateGameBody, context) {
    const token = getCookieValue(context.cookie, AUTH_COOKIE);
    const user = await getCurrentUser(token);
    if (!user) throw new MutationError('Forbidden', 403);

    const requestedLayout = typeof body.boardLayoutId === 'string' ? body.boardLayoutId.trim() : '';
    let boardLayoutId: number | null = null;
    let boardLayoutName = 'Standard';

    if (requestedLayout) {
      boardLayoutId = await syncLayoutFromSun(requestedLayout);
      const loaded = loadLayout(boardLayoutId);
      if (!loaded) throw new MutationError('Board layout not found', 400);
      mountGame(loaded);
      boardLayoutName = getLayout(boardLayoutId)?.name ?? 'Custom';
    } else {
      const standard = mountStandardLayout();
      boardLayoutId = standard.id;
      boardLayoutName = standard.name;
    }

    const id = createStoredGame({
      boardLayoutId,
      boardLayoutName,
      initialState: serializeGameState(gameState),
      creatorAccountId: user.id,
    });

    return { id };
  },
});
