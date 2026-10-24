/**
 * Data-driven description of a chess piece.
 */
export type RangeType = 'step' | 'slide' | 'hop';

export type CapturePolicy = 'optional' | 'required' | 'forbidden';

export interface MoveVector {
  /**
   * Horizontal offset, white-oriented.
   */
  dx: number;
  /**
   * Vertical offset, white-oriented (positive = up the board).
   */
  dy: number;
  /**
   * How far the vector reaches.
   */
  range: RangeType;
  /**
   * Whether the target square may / must / must not hold an enemy piece.
   */
  capture: CapturePolicy;
  /**
   * Only legal on the piece's first move.
   */
  firstMoveOnly?: boolean;
  /**
   * Pawn-style two-square push.
   */
  doubleStep?: boolean;
  /**
   * Eligible for en passant capture.
   */
  enPassant?: boolean;
  /**
   * Generates promotion variants on the final rank.
   */
  promotes?: boolean;
  /**
   * Castling side this vector represents.
   */
  castling?: 'kingSide' | 'queenSide';
}

export interface PieceMoveState {
  /**
   * Zero-based state index.
   */
  index: number;
  /**
   * Vectors available in this state.
   */
  vectors: MoveVector[];
}

export type StateTransition = 'none' | 'advance' | 'advanceReverseAtEdge' | 'cycle';

/**
 * Check whether an offset lies on one of the eight compass directions.
 *
 * @param dx Horizontal offset.
 * @param dy Vertical offset.
 * @returns True for orthogonal or diagonal offsets.
 */
export function isCompassDirection(dx: number, dy: number): boolean {
  return dx === 0 || dy === 0 || Math.abs(dx) === Math.abs(dy);
}

export interface PieceDefinition {
  /**
   * Definition id.
   */
  id: number;
  /**
   * Stable slug used by factories and serialization.
   */
  slug: string;
  /**
   * Human-readable name.
   */
  name: string;
  /**
   * Whether this piece is a king (check target).
   */
  isKing: boolean;
  /**
   * Definition ids this piece may promote to.
   */
  promotionTargets: number[];
  /**
   * Engine ranks that trigger promotion.
   */
  promotionRanks: number[];
  /**
   * Per-move variation states.
   */
  moveStates: PieceMoveState[];
  /**
   * How the state index advances after a move.
   */
  stateTransition: StateTransition;
  /**
   * Reset the state index on reaching the back rank.
   */
  edgeReset: boolean;
  /**
   * Sprite part keys.
   */
  sprite: { headKey: string; bodyKey: string; footKey: string };

  /**
   * Legacy engine flags and behaviour.
   */
  legacy?: {
    isPawn: boolean;
    isLeaper: boolean;
    isSlider: boolean;
    enpassant: boolean;
    promote: boolean;
    rotationalMoveType: string;
    moveBehavior: MoveBehaviorLike;
  };
}

/**
 * Structural type for the legacy behaviour objects so this module does not
 * import the concrete classes.
 */
export interface MoveBehaviorLike {
  initializeAttacks(): void;
}
