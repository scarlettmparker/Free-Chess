import { defineLoader } from '@sun/ssr';
import { listLayouts, getLayout } from '~/server/board-layouts';

/**
 * List all board layouts.
 */
defineLoader({
  pattern: 'boards',
  async loader() {
    return { boards: listLayouts() };
  },
});

/**
 * Get one board layout.
 *
 * @param params Route params.
 */
defineLoader({
  pattern: 'boards/:id',
  async loader(params) {
    const id = Number(params.id);
    return { board: getLayout(id) };
  },
});
