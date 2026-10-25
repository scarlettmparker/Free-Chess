import { defineLoader } from '@sun/ssr';
import { executeDocument } from '@sun/api';
import { ListBoardLayoutsDocument, GetBoardLayoutDocument, type ListBoardLayoutsQuery, type GetBoardLayoutQuery } from '~/generated/graphql';

/**
 * Lists all board layouts.
 */
defineLoader({
  pattern: 'boards',
  async loader() {
    try {
      const result = await executeDocument<ListBoardLayoutsQuery>(ListBoardLayoutsDocument);
      if (result?.success && result.data) {
        return { boards: result.data.medusaQueries.boardLayouts ?? [] };
      }
      return { boards: [] };
    } catch (error) {
      console.error('Failed to fetch board layouts:', error);
      return { boards: [] };
    }
  },
});

/**
 * Gets one board layout.
 *
 * @param params route params
 */
defineLoader({
  pattern: 'boards/:id',
  async loader(params) {
    const id = params.id as string;
    if (!id) return null;
    try {
      const result = await executeDocument<GetBoardLayoutQuery>(GetBoardLayoutDocument, { id });
      if (result?.success && result.data) {
        return { board: result.data.medusaQueries.boardLayout ?? null };
      }
      return null;
    } catch (error) {
      console.error('Failed to fetch board layout:', error);
      return null;
    }
  },
});