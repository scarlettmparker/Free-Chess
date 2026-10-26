import type { PieceDefinition } from '~/game/piece/piece-definition';

/**
 * Engine id reserved for the two-state leaper fixture.
 */
export const STATEFUL_LEAPER_ID = 9001;

/**
 * Engine id reserved for the mixed hop and slide fixture.
 */
export const MIXED_HOPPER_ID = 9002;

/**
 * Build the two-state leaper used by attack regressions.
 *
 * State 0 jumps one square forward. State 1 jumps two squares along the
 * diagonal and covers b1 from d3 for black.
 *
 * @returns A stateful leaper definition.
 */
export function statefulLeaper(): PieceDefinition {
  return {
    id: STATEFUL_LEAPER_ID,
    slug: 'stateful-leaper',
    name: 'Stateful Leaper',
    isKing: false,
    promotionTargets: [],
    promotionRanks: [],
    moveStates: [
      {
        index: 0,
        vectors: [{ dx: 0, dy: 1, range: 'hop', capture: 'optional' }],
      },
      {
        index: 1,
        vectors: [{ dx: 2, dy: 2, range: 'hop', capture: 'optional' }],
      },
    ],
    stateTransition: 'advance',
    edgeReset: false,
    sprite: { headKey: 'pawn-head', bodyKey: 'pawn-body', footKey: 'pawn-foot' },
  };
}

/**
 * Build a piece with both a jump and a slide in one state.
 *
 * @returns A mixed hop and slide definition.
 */
export function mixedHopper(): PieceDefinition {
  return {
    id: MIXED_HOPPER_ID,
    slug: 'mixed-hopper',
    name: 'Mixed Hopper',
    isKing: false,
    promotionTargets: [],
    promotionRanks: [],
    moveStates: [
      {
        index: 0,
        vectors: [
          { dx: 0, dy: 2, range: 'hop', capture: 'optional' },
          { dx: 2, dy: 2, range: 'slide', capture: 'optional' },
        ],
      },
    ],
    stateTransition: 'none',
    edgeReset: false,
    sprite: { headKey: 'pawn-head', bodyKey: 'pawn-body', footKey: 'pawn-foot' },
  };
}
