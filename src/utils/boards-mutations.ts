import { defineMutation, MutationError } from '@sun/ssr';
import { executeDocument } from '@sun/api';
import { SaveBoardLayoutDocument, DeleteBoardLayoutDocument, type SaveBoardLayoutMutation, type DeleteBoardLayoutMutation } from '~/generated/graphql';
import type { BoardLayoutInput } from '~/utils/board-layout-types';

/**
 * Saves a board layout.
 */
defineMutation({
  path: 'boards/save',
  async handler(body: BoardLayoutInput) {
    const result = await executeDocument<SaveBoardLayoutMutation>(SaveBoardLayoutDocument, { input: body });
    if (!result.success || !result.data?.medusaMutations.saveBoardLayout.boardLayout) {
      throw new MutationError(result.error ?? 'Failed to save board layout');
    }
    return { id: result.data.medusaMutations.saveBoardLayout.boardLayout.id };
  },
});

/**
 * Deletes a board layout.
 */
defineMutation({
  path: 'boards/delete',
  async handler(body: { id: number | string }) {
    const result = await executeDocument<DeleteBoardLayoutMutation>(DeleteBoardLayoutDocument, { id: String(body.id) });
    if (!result.success || !result.data?.medusaMutations.deleteBoardLayout.ok) {
      throw new MutationError(result.error ?? 'Cannot delete board layout');
    }
    return { ok: true };
  },
});