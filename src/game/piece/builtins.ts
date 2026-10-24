import { LeaperMoveBehavior, PawnMoveBehavior, SlidingMoveBehavior } from './piece';
import { pieceRegistry } from './piece-registry';
import type { PieceDefinition } from './piece-definition';

/**
 * Build a move vector.
 *
 * @param dx Horizontal offset.
 * @param dy Vertical offset.
 * @param range Movement range.
 * @param capture Capture policy.
 * @param extra Additional vector fields.
 * @returns A move vector.
 */
const V = (
  dx: number,
  dy: number,
  range: 'step' | 'slide' | 'hop',
  capture: 'optional' | 'required' | 'forbidden',
  extra: Partial<import('./piece-definition').MoveVector> = {},
) => ({
  dx,
  dy,
  range,
  capture,
  ...extra,
});

/**
 * Build step vectors for a set of directions.
 *
 * @param dirs Direction list.
 * @param capture Capture policy.
 * @returns Step move vectors.
 */
const stepDirs = (
  dirs: Array<[number, number]>,
  capture: 'optional' | 'required' | 'forbidden' = 'optional',
) => dirs.map(([dx, dy]) => V(dx, dy, 'step', capture));

/**
 * Build slide vectors for a set of directions.
 *
 * @param dirs Direction list.
 * @returns Slide move vectors.
 */
const slideDirs = (dirs: Array<[number, number]>) =>
  dirs.map(([dx, dy]) => V(dx, dy, 'slide', 'optional'));

const ORTH: Array<[number, number]> = [
  [0, 1],
  [0, -1],
  [1, 0],
  [-1, 0],
];
const DIAG: Array<[number, number]> = [
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
];
const ALL8: Array<[number, number]> = [...ORTH, ...DIAG];

const kingVectors = stepDirs(ALL8);
const knightVectors = stepDirs([
  [-2, 1],
  [-1, 2],
  [1, 2],
  [2, 1],
  [-2, -1],
  [-1, -2],
  [1, -2],
  [2, -1],
]);

const balloonState0 = stepDirs([
  [0, 2],
  [0, -2],
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
]);
const balloonState1 = stepDirs([
  [0, 2],
  [0, -2],
  [1, 2],
  [1, -2],
  [2, 1],
  [2, -1],
  [-1, 2],
  [-1, -2],
  [-2, 1],
  [-2, -1],
]);

const spongebobStates = [
  stepDirs([
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ]),
  stepDirs([
    [2, 0],
    [-2, 0],
    [0, 2],
    [0, -2],
    [2, 2],
    [2, -2],
    [-2, 2],
    [-2, -2],
  ]),
  stepDirs([
    [3, 0],
    [-3, 0],
    [0, 3],
    [0, -3],
    [3, 3],
    [3, -3],
    [-3, 3],
    [-3, -3],
  ]),
  stepDirs([
    [2, 0],
    [-2, 0],
    [0, 2],
    [0, -2],
    [2, 2],
    [2, -2],
    [-2, 2],
    [-2, -2],
  ]),
];

const pogoStates = [
  [V(0, 2, 'step', 'optional')],
  [V(0, -1, 'step', 'optional')],
  [V(0, 1, 'step', 'optional')],
  [V(0, -2, 'step', 'optional')],
];

const pawnVectors = [
  V(0, 1, 'step', 'forbidden', { firstMoveOnly: false, promotes: true }),
  V(0, 2, 'step', 'forbidden', { firstMoveOnly: true, doubleStep: true, promotes: true }),
  V(-1, 1, 'step', 'required', { enPassant: true, promotes: true }),
  V(1, 1, 'step', 'required', { enPassant: true, promotes: true }),
];

const queenVectors = slideDirs(ALL8);
const rookVectors = slideDirs(ORTH);
const bishopVectors = slideDirs(DIAG);

export const BUILTIN_DEFINITIONS: PieceDefinition[] = [
  {
    id: 1,
    slug: 'king',
    name: 'King',
    isKing: true,
    promotionTargets: [],
    promotionRanks: [],
    moveStates: [{ index: 0, vectors: kingVectors }],
    stateTransition: 'none',
    edgeReset: false,
    sprite: { headKey: 'king-head', bodyKey: 'king-body', footKey: 'king-foot' },
    legacy: {
      isPawn: false,
      isLeaper: true,
      isSlider: false,
      enpassant: false,
      promote: false,
      rotationalMoveType: 'DEFAULT',
      moveBehavior: new LeaperMoveBehavior([
        [
          [-1, 1],
          [0, 1],
          [1, 1],
          [-1, 0],
          [1, 0],
          [-1, -1],
          [0, -1],
          [1, -1],
        ],
      ]),
    },
  },
  {
    id: 2,
    slug: 'queen',
    name: 'Queen',
    isKing: false,
    promotionTargets: [],
    promotionRanks: [],
    moveStates: [{ index: 0, vectors: queenVectors }],
    stateTransition: 'none',
    edgeReset: false,
    sprite: { headKey: 'queen-head', bodyKey: 'queen-body', footKey: 'queen-foot' },
    legacy: {
      isPawn: false,
      isLeaper: false,
      isSlider: true,
      enpassant: false,
      promote: false,
      rotationalMoveType: 'DEFAULT',
      moveBehavior: new SlidingMoveBehavior(true, true),
    },
  },
  {
    id: 3,
    slug: 'rook',
    name: 'Rook',
    isKing: false,
    promotionTargets: [],
    promotionRanks: [],
    moveStates: [{ index: 0, vectors: rookVectors }],
    stateTransition: 'none',
    edgeReset: false,
    sprite: { headKey: 'rook-head', bodyKey: 'rook-body', footKey: 'rook-foot' },
    legacy: {
      isPawn: false,
      isLeaper: false,
      isSlider: true,
      enpassant: false,
      promote: false,
      rotationalMoveType: 'DEFAULT',
      moveBehavior: new SlidingMoveBehavior(true, false),
    },
  },
  {
    id: 4,
    slug: 'bishop',
    name: 'Bishop',
    isKing: false,
    promotionTargets: [],
    promotionRanks: [],
    moveStates: [{ index: 0, vectors: bishopVectors }],
    stateTransition: 'none',
    edgeReset: false,
    sprite: { headKey: 'bishop-head', bodyKey: 'bishop-body', footKey: 'bishop-foot' },
    legacy: {
      isPawn: false,
      isLeaper: false,
      isSlider: true,
      enpassant: false,
      promote: false,
      rotationalMoveType: 'DEFAULT',
      moveBehavior: new SlidingMoveBehavior(false, true),
    },
  },
  {
    id: 5,
    slug: 'knight',
    name: 'Knight',
    isKing: false,
    promotionTargets: [],
    promotionRanks: [],
    moveStates: [{ index: 0, vectors: knightVectors }],
    stateTransition: 'none',
    edgeReset: false,
    sprite: { headKey: 'knight-head', bodyKey: 'knight-body', footKey: 'knight-foot' },
    legacy: {
      isPawn: false,
      isLeaper: true,
      isSlider: false,
      enpassant: false,
      promote: false,
      rotationalMoveType: 'DEFAULT',
      moveBehavior: new LeaperMoveBehavior([
        [
          [-2, 1],
          [-1, 2],
          [1, 2],
          [2, 1],
          [-2, -1],
          [-1, -2],
          [1, -2],
          [2, -1],
        ],
      ]),
    },
  },
  {
    id: 6,
    slug: 'pawn',
    name: 'Pawn',
    isKing: false,
    promotionTargets: [2, 3, 4, 5],
    promotionRanks: [],
    moveStates: [{ index: 0, vectors: pawnVectors }],
    stateTransition: 'none',
    edgeReset: false,
    sprite: { headKey: 'pawn-head', bodyKey: 'pawn-body', footKey: 'pawn-foot' },
    legacy: {
      isPawn: true,
      isLeaper: false,
      isSlider: false,
      enpassant: true,
      promote: true,
      rotationalMoveType: 'DEFAULT',
      moveBehavior: new PawnMoveBehavior(),
    },
  },
  {
    id: 7,
    slug: 'balloon',
    name: 'Balloon',
    isKing: false,
    promotionTargets: [],
    promotionRanks: [],
    moveStates: [
      { index: 0, vectors: balloonState0 },
      { index: 1, vectors: balloonState1 },
    ],
    stateTransition: 'advance',
    edgeReset: false,
    sprite: { headKey: 'balloon-head', bodyKey: 'balloon-body', footKey: 'balloon-foot' },
    legacy: {
      isPawn: false,
      isLeaper: true,
      isSlider: false,
      enpassant: false,
      promote: false,
      rotationalMoveType: 'ROTATE',
      moveBehavior: new LeaperMoveBehavior([
        balloonState0.map((v) => [v.dx, v.dy]),
        balloonState1.map((v) => [v.dx, v.dy]),
      ]),
    },
  },
  {
    id: 8,
    slug: 'pogo',
    name: 'Pogo',
    isKing: false,
    promotionTargets: [],
    promotionRanks: [],
    moveStates: pogoStates.map((vectors, index) => ({ index, vectors })),
    stateTransition: 'advanceReverseAtEdge',
    edgeReset: true,
    sprite: { headKey: 'pogo-head', bodyKey: 'pogo-body', footKey: 'pogo-foot' },
    legacy: {
      isPawn: false,
      isLeaper: true,
      isSlider: false,
      enpassant: false,
      promote: false,
      rotationalMoveType: 'REVERSE_ROTATE',
      moveBehavior: new LeaperMoveBehavior(pogoStates.map((s) => s.map((v) => [v.dx, v.dy]))),
    },
  },
  {
    id: 9,
    slug: 'spongebob',
    name: 'Spongebob',
    isKing: false,
    promotionTargets: [],
    promotionRanks: [],
    moveStates: spongebobStates.map((vectors, index) => ({ index, vectors })),
    stateTransition: 'advance',
    edgeReset: false,
    sprite: { headKey: 'spongebob-head', bodyKey: 'spongebob-body', footKey: 'spongebob-foot' },
    legacy: {
      isPawn: false,
      isLeaper: true,
      isSlider: false,
      enpassant: false,
      promote: false,
      rotationalMoveType: 'ROTATE',
      moveBehavior: new LeaperMoveBehavior(spongebobStates.map((s) => s.map((v) => [v.dx, v.dy]))),
    },
  },
];

/**
 * Register all built-in definitions with their historical engine ids.
 */
export function registerBuiltins(): void {
  const engineBaseIds: Record<string, number> = {
    king: 10,
    queen: 8,
    rook: 6,
    bishop: 4,
    knight: 2,
    pawn: 0,
    balloon: 14,
    pogo: 12,
    spongebob: 16,
  };

  for (const definition of BUILTIN_DEFINITIONS) {
    pieceRegistry.register(definition, engineBaseIds[definition.slug]);
  }
}

// Auto-register on import.
registerBuiltins();
