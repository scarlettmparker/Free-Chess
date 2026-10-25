export type PieceSpriteDto = {
  /**
   * Head part key.
   */
  headKey: string;
  /**
   * Body part key.
   */
  bodyKey: string;
  /**
   * Foot part key.
   */
  footKey: string;
};

export type PieceDefinitionDto = {
  /**
   * Definition id.
   */
  id: number;
  /**
   * Stable slug.
   */
  slug: string;
  /**
   * Display name.
   */
  name: string;
  /**
   * Optional description.
   */
  description: string | null;
  /**
   * Whether this is a king.
   */
  isKing: boolean;
  /**
   * Definition ids this piece promotes to.
   */
  promotionTargets: number[];
  /**
   * Ranks that trigger promotion.
   */
  promotionRanks: number[];
  /**
   * Per-move state list.
   */
  moveStates: unknown[];
  /**
   * State transition mode.
   */
  stateTransition: string;
  /**
   * Whether state resets at the back rank.
   */
  edgeReset: boolean;
  /**
   * Sprite part keys.
   */
  sprite: PieceSpriteDto;
  /**
   * Whether this is a system piece.
   */
  isSystem: boolean;
  /**
   * Owner account id.
   */
  createdBy?: string | null;
  /**
   * Owner display name.
   */
  ownerName?: string | null;
  /**
   * Creation timestamp.
   */
  createdAt: string;
  /**
   * Update timestamp.
   */
  updatedAt: string;
};

export type PieceSetMemberDto = {
  /**
   * Slot name.
   */
  slot: string;
  /**
   * Piece definition id.
   */
  pieceDefinitionId: number;
};

export type PieceSetDto = {
  /**
   * Set id.
   */
  id: number;
  /**
   * Set name.
   */
  name: string;
  /**
   * Optional description.
   */
  description: string | null;
  /**
   * Starting FEN.
   */
  startingFen: string;
  /**
   * Whether this is a system set.
   */
  isSystem: boolean;
  /**
   * Creation timestamp.
   */
  createdAt: string;
  /**
   * Set members.
   */
  members: PieceSetMemberDto[];
};
