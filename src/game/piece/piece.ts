import { colors } from '~/game/consts/board';

// Interface for move behavior
export interface MoveBehavior {
  initializeAttacks(): void;
}

// Leaper move behavior
export class LeaperMoveBehavior implements MoveBehavior {
  private leaperOffsets: number[][][];
  private leaperPieceStateLo: Uint32Array[][];
  private leaperPieceStateHi: Uint32Array[][];

  constructor(leaperOffsets: number[][][]) {
    this.leaperOffsets = leaperOffsets;
    this.leaperPieceStateLo = Array.from({ length: 2 }, () =>
      Array.from({ length: leaperOffsets.length }, () => new Uint32Array(64)),
    );
    this.leaperPieceStateHi = Array.from({ length: 2 }, () =>
      Array.from({ length: leaperOffsets.length }, () => new Uint32Array(64)),
    );
  }

  /**
   * Initialize leaper piece attacks.
   */
  initializeAttacks(): void {
    for (let i = 0; i < this.leaperOffsets.length; i++) {
      for (let square = 0; square < 64; square++) {
        const white = this.maskLeaperAttacks(square, this.leaperOffsets[i], colors.WHITE);
        const black = this.maskLeaperAttacks(square, this.leaperOffsets[i], colors.BLACK);
        this.leaperPieceStateLo[colors.WHITE][i][square] = white.lo;
        this.leaperPieceStateHi[colors.WHITE][i][square] = white.hi;
        this.leaperPieceStateLo[colors.BLACK][i][square] = black.lo;
        this.leaperPieceStateHi[colors.BLACK][i][square] = black.hi;
      }
    }
  }

  /**
   * Low 32 bits of the leaper attack table.
   */
  getLeaperPieceStateLo(): Uint32Array[][] {
    return this.leaperPieceStateLo;
  }

  /**
   * High 32 bits of the leaper attack table.
   */
  getLeaperPieceStateHi(): Uint32Array[][] {
    return this.leaperPieceStateHi;
  }

  /**
   * Mask leaper attacks.
   */
  private maskLeaperAttacks(
    pos: number,
    offsets: number[][],
    color: number,
  ): { lo: number; hi: number } {
    let lo = 0;
    let hi = 0;
    const rankTop = pos >> 3;
    const file = pos & 7;
    const sign = color === colors.BLACK ? -1 : 1;
    for (let o = 0; o < offsets.length; o++) {
      const df = offsets[o][0];
      const dr = offsets[o][1];
      const nf = file + sign * df;
      const nrt = rankTop - sign * dr;
      if (nf < 0 || nf > 7 || nrt < 0 || nrt > 7) continue;
      const sq = nrt * 8 + nf;
      if (sq < 32) lo |= 1 << sq;
      else hi |= 1 << (sq - 32);
    }
    return { lo, hi };
  }

  // Getters
  getLeaperOffsets(): number[][][] {
    return this.leaperOffsets;
  }

  // Setters
  setLeaperOffsets(offsets: number[][][]): void {
    this.leaperOffsets = offsets;
  }
}

// Pawn move behavior
export class PawnMoveBehavior implements MoveBehavior {
  private pawnPieceStateLo: Uint32Array[];
  private pawnPieceStateHi: Uint32Array[];

  constructor() {
    this.pawnPieceStateLo = Array.from({ length: 2 }, () => new Uint32Array(64));
    this.pawnPieceStateHi = Array.from({ length: 2 }, () => new Uint32Array(64));
  }

  /**
   * Initialize pawn piece attacks.
   */
  initializeAttacks(): void {
    for (let square = 0; square < 64; square++) {
      const white = this.maskPawnAttacks(colors.WHITE, square);
      const black = this.maskPawnAttacks(colors.BLACK, square);
      this.pawnPieceStateLo[colors.WHITE][square] = white.lo;
      this.pawnPieceStateHi[colors.WHITE][square] = white.hi;
      this.pawnPieceStateLo[colors.BLACK][square] = black.lo;
      this.pawnPieceStateHi[colors.BLACK][square] = black.hi;
    }
  }

  /**
   * Low 32 bits of the pawn attack table.
   */
  getPawnPieceStateLo(): Uint32Array[] {
    return this.pawnPieceStateLo;
  }

  /**
   * High 32 bits of the pawn attack table.
   */
  getPawnPieceStateHi(): Uint32Array[] {
    return this.pawnPieceStateHi;
  }

  /**
   * Mask pawn attacks.
   */
  private maskPawnAttacks(color: number, pos: number): { lo: number; hi: number } {
    let lo = 0;
    let hi = 0;
    const rankTop = pos >> 3;
    const file = pos & 7;
    // white captures toward rankTop - 1, black toward rankTop + 1
    const nrt = color === colors.WHITE ? rankTop - 1 : rankTop + 1;
    if (nrt < 0 || nrt > 7) return { lo, hi };
    if (file - 1 >= 0) {
      const sq = nrt * 8 + (file - 1);
      if (sq < 32) lo |= 1 << sq;
      else hi |= 1 << (sq - 32);
    }
    if (file + 1 <= 7) {
      const sq = nrt * 8 + (file + 1);
      if (sq < 32) lo |= 1 << sq;
      else hi |= 1 << (sq - 32);
    }
    return { lo, hi };
  }
}

/**
 * Pack the occupancy bits at the given positions into a compact index.
 */
function pextIndex(occLo: number, occHi: number, bits: number[]): number {
  let idx = 0;
  for (let k = 0; k < bits.length; k++) {
    const sq = bits[k];
    if (sq < 32) {
      if ((occLo >>> sq) & 1) idx |= 1 << k;
    } else {
      if ((occHi >>> (sq - 32)) & 1) idx |= 1 << k;
    }
  }
  return idx;
}

// Sliding move behavior
export class SlidingMoveBehavior implements MoveBehavior {
  private straight: boolean;
  private diagonal: boolean;
  // attack tables (lo/hi per square) and the relevant mask bit positions
  private straightAttackLo: Uint32Array[];
  private straightAttackHi: Uint32Array[];
  private straightMaskBits: number[][];
  private diagonalAttackLo: Uint32Array[];
  private diagonalAttackHi: Uint32Array[];
  private diagonalMaskBits: number[][];

  constructor(straight: boolean, diagonal: boolean) {
    this.straight = straight;
    this.diagonal = diagonal;
    this.straightAttackLo = [];
    this.straightAttackHi = [];
    this.straightMaskBits = [];
    this.diagonalAttackLo = [];
    this.diagonalAttackHi = [];
    this.diagonalMaskBits = [];
  }

  /**
   * Initialize sliding piece attacks.
   */
  initializeAttacks(): void {
    // sliding pieces initialize their attack tables externally
  }

  /**
   * Get sliding piece attacks as {lo, hi}.
   */
  getSliderAttacksLoHi(pos: number, occLo: number, occHi: number): { lo: number; hi: number } {
    let lo = 0;
    let hi = 0;
    if (this.straight) {
      const idx = pextIndex(occLo, occHi, this.straightMaskBits[pos]);
      lo |= this.straightAttackLo[pos][idx];
      hi |= this.straightAttackHi[pos][idx];
    }
    if (this.diagonal) {
      const idx = pextIndex(occLo, occHi, this.diagonalMaskBits[pos]);
      lo |= this.diagonalAttackLo[pos][idx];
      hi |= this.diagonalAttackHi[pos][idx];
    }
    return { lo, hi };
  }

  // Getters
  getStraight(): boolean {
    return this.straight;
  }

  getDiagonal(): boolean {
    return this.diagonal;
  }

  // Setters
  setStraight(straight: boolean): void {
    this.straight = straight;
  }

  setDiagonal(diagonal: boolean): void {
    this.diagonal = diagonal;
  }

  setStraightAttackTables(lo: Uint32Array[], hi: Uint32Array[], bits: number[][]): void {
    this.straightAttackLo = lo;
    this.straightAttackHi = hi;
    this.straightMaskBits = bits;
  }

  setDiagonalAttackTables(lo: Uint32Array[], hi: Uint32Array[], bits: number[][]): void {
    this.diagonalAttackLo = lo;
    this.diagonalAttackHi = hi;
    this.diagonalMaskBits = bits;
  }
}

// Piece base class
abstract class Piece {
  private id: number;
  private color: number;
  private move: number;
  private globalEffect: boolean;
  private firstMove: number;
  private king: boolean;
  private pawn: boolean;
  private enpassant: boolean;
  private promote: boolean;
  private slider: boolean;
  private leaper: boolean;
  private moveBehavior: MoveBehavior;
  private pieceMask: BigUint64Array;
  private rotationalMoveType: string;
  private reverse: Map<number, number>;

  constructor(
    id: number,
    color: number,
    moveBehavior: MoveBehavior,
    rotationalMoveType: string = 'DEFAULT',
  ) {
    this.id = id;
    this.color = color;
    this.move = 0;
    this.globalEffect = false;
    this.firstMove = -1;
    this.king = false;
    this.pawn = false;
    this.enpassant = false;
    this.promote = false;
    this.slider = false;
    this.leaper = false;
    this.moveBehavior = moveBehavior;
    this.pieceMask = new BigUint64Array(64);
    this.rotationalMoveType = rotationalMoveType;
    this.reverse = new Map<number, number>();
    this.moveBehavior.initializeAttacks();
  }

  // Getters
  getId(): number {
    return this.id;
  }

  getColor(): number {
    return this.color;
  }

  getMove(): number {
    return this.move;
  }

  getGlobalEffect(): boolean {
    return this.globalEffect;
  }

  getFirstMove(): number {
    return this.firstMove;
  }

  getKing(): boolean {
    return this.king;
  }

  getPawn(): boolean {
    return this.pawn;
  }

  getEnpassant(): boolean {
    return this.enpassant;
  }

  getPromote(): boolean {
    return this.promote;
  }

  getSlider(): boolean {
    return this.slider;
  }

  getLeaper(): boolean {
    return this.leaper;
  }

  getMoveBehavior(): MoveBehavior {
    return this.moveBehavior;
  }

  getPieceMask(): BigUint64Array {
    return this.pieceMask;
  }

  getRotationalMoveType(): string {
    return this.rotationalMoveType;
  }

  getReverse(): Map<number, number> {
    return this.reverse;
  }

  // Setters
  setId(id: number): void {
    this.id = id;
  }

  setColor(color: number): void {
    this.color = color;
  }

  setMove(move: number): void {
    this.move = move;
  }

  setGlobalEffect(effect: boolean): void {
    this.globalEffect = effect;
  }

  setFirstMove(move: number): void {
    this.firstMove = move;
  }

  setKing(king: boolean): void {
    this.king = king;
  }

  setPawn(pawn: boolean): void {
    this.pawn = pawn;
  }

  setEnpassant(enpassant: boolean): void {
    this.enpassant = enpassant;
  }

  setPromote(promote: boolean): void {
    this.promote = promote;
  }

  setSlider(slider: boolean): void {
    this.slider = slider;
  }

  setLeaper(leaper: boolean): void {
    this.leaper = leaper;
  }

  setMoveBehavior(behavior: MoveBehavior): void {
    this.moveBehavior = behavior;
  }

  setPieceMask(mask: BigUint64Array): void {
    this.pieceMask = mask;
  }

  setRotationalMoveType(type: string): void {
    this.rotationalMoveType = type;
  }

  setReverse(reverse: Map<number, number>): void {
    this.reverse = reverse;
  }
}

export class KingPiece extends Piece {
  constructor(id: number, color: number) {
    super(
      id,
      color,
      new LeaperMoveBehavior([
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
    );
    this.setKing(true);
    this.setLeaper(true);
  }
}

export class QueenPiece extends Piece {
  constructor(id: number, color: number) {
    super(id, color, new SlidingMoveBehavior(true, true));
    this.setSlider(true);
  }
}

export class RookPiece extends Piece {
  constructor(id: number, color: number) {
    super(id, color, new SlidingMoveBehavior(true, false));
    this.setSlider(true);
  }
}

export class BishopPiece extends Piece {
  constructor(id: number, color: number) {
    super(id, color, new SlidingMoveBehavior(false, true));
    this.setSlider(true);
  }
}

export class KnightPiece extends Piece {
  constructor(id: number, color: number) {
    super(
      id,
      color,
      new LeaperMoveBehavior([
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
    );
    this.setLeaper(true);
  }
}

export class PawnPiece extends Piece {
  constructor(id: number, color: number) {
    super(id, color, new PawnMoveBehavior());
    this.setPawn(true);
    this.setEnpassant(true);
    this.setPromote(true);
  }
}

export class BalloonPiece extends Piece {
  constructor(id: number, color: number) {
    super(
      id,
      color,
      new LeaperMoveBehavior([
        [
          [0, 2],
          [0, -2],
          [1, 1],
          [1, -1],
          [-1, 1],
          [-1, -1],
        ],
        [
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
        ],
      ]),
      'ROTATE',
    );
    this.setLeaper(true);
  }
}

export class SpongebobPiece extends Piece {
  constructor(id: number, color: number) {
    super(
      id,
      color,
      new LeaperMoveBehavior([
        [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
          [1, 1],
          [1, -1],
          [-1, 1],
          [-1, -1],
        ],
        [
          [2, 0],
          [-2, 0],
          [0, 2],
          [0, -2],
          [2, 2],
          [2, -2],
          [-2, 2],
          [-2, -2],
        ],
        [
          [3, 0],
          [-3, 0],
          [0, 3],
          [0, -3],
          [3, 3],
          [3, -3],
          [-3, 3],
          [-3, -3],
        ],
        [
          [2, 0],
          [-2, 0],
          [0, 2],
          [0, -2],
          [2, 2],
          [2, -2],
          [-2, 2],
          [-2, -2],
        ],
      ]),
      'ROTATE',
    );
    this.setLeaper(true);
  }
}

export class PogoPiece extends Piece {
  constructor(id: number, color: number) {
    super(
      id,
      color,
      new LeaperMoveBehavior([[[0, 2]], [[0, -1]], [[0, 1]], [[0, -2]]]),
      'REVERSE_ROTATE',
    );
    this.setLeaper(true);
  }
}

// Piece factory
class PieceFactory {
  static createPiece(type: string, id: number, color: number): Piece {
    switch (type.toLowerCase()) {
      case 'king':
        return new KingPiece(id, color);
      case 'queen':
        return new QueenPiece(id, color);
      case 'rook':
        return new RookPiece(id, color);
      case 'bishop':
        return new BishopPiece(id, color);
      case 'knight':
        return new KnightPiece(id, color);
      case 'pawn':
        return new PawnPiece(id, color);
      case 'balloon':
        return new BalloonPiece(id, color);
      case 'pogo':
        return new PogoPiece(id, color);
      case 'spongebob':
        return new SpongebobPiece(id, color);
      default:
        throw new Error(`Unknown piece type: ${type}`);
    }
  }
}

export { Piece, PieceFactory };
