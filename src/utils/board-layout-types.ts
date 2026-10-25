import type { ListBoardLayoutsQuery, BoardLayoutInput as GeneratedBoardLayoutInput } from '~/generated/graphql';
import type { BoardPlacement } from '~/game/board/validate-layout';

type GeneratedBoardLayout = ListBoardLayoutsQuery['medusaQueries']['boardLayouts'][number];

export type BoardLayoutDto = Omit<GeneratedBoardLayout, 'placements'> & {
  /**
   * Piece placements.
   */
  placements: BoardPlacement<string>[];
};

export type BoardLayoutInput = Omit<GeneratedBoardLayoutInput, 'placements'> & {
  /**
   * Piece placements.
   */
  placements: BoardPlacement<string>[];
};
