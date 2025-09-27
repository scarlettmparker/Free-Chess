import {
  straightRelevantBits,
  straightBitMask,
  diagonalRelevantBits,
  diagonalBitMask,
} from '~/game/consts/bits';
import { colors, notAFile, notHFile } from '~/game/consts/board';
import { straightMagicNumbers, diagonalMagicNumbers } from '~/game/consts/magic';
import { applyConstraintsToMoves } from '~/game/init/sliding-piece';
import setBit from '~/game/board/bitboard';
import { getFileConstraint } from '~/game/board/square-helper';

// Interface for move behavior
export interface MoveBehavior {
  initializeAttacks(): void;
  getAttacks(pos: number, occupancy: bigint, color: number, moveIndex: number): bigint;
}

// Leaper move behavior
export class LeaperMoveBehavior implements MoveBehavior {
  private leaperOffsets: number[][][];
  private leaperPieceState: BigUint64Array[][];

  constructor(leaperOffsets: number[][][]) {
    this.leaperOffsets = leaperOffsets;
    this.leaperPieceState = Array.from({ length: 2 }, () =>
      Array.from({ length: leaperOffsets.length }, () => new BigUint64Array(64)),
    );
  }

  /** Initialize leaper piece attacks */
  initializeAttacks(): void {
    for (let i = 0; i < this.leaperOffsets.length; i++) {
      for (let square = 0; square < 64; square++) {
        this.leaperPieceState[colors.WHITE][i][square] = this.maskLeaperAttacks(
          square,
          this.leaperOffsets[i],
          colors.WHITE,
        );
        this.leaperPieceState[colors.BLACK][i][square] = this.maskLeaperAttacks(
          square,
          this.leaperOffsets[i],
          colors.BLACK,
        );
      }
    }
  }

  /** Get leaper piece attacks */
  getAttacks(pos: number, occupancy: bigint, color: number, moveIndex: number): bigint {
    return this.leaperPieceState[color][moveIndex][pos];
  }

  /** Mask leaper attacks */
  private maskLeaperAttacks(pos: number, offsets: number[][], color: number): bigint {
    let currentAttacks = 0n;
    let currentBitboard = 0n;
    currentBitboard = setBit(currentBitboard, pos, true);
    const isBlack = color === colors.BLACK;

    for (let [fileOffset, rankOffset] of offsets) {
      if (isBlack) {
        fileOffset = -fileOffset;
        rankOffset = -rankOffset;
      }

      const shift = BigInt(rankOffset * 8 - fileOffset);
      const fileConstraint = getFileConstraint(fileOffset);

      if (shift > 0n) {
        if (((currentBitboard >> shift) & fileConstraint) !== 0n) {
          const shiftedBitboard = currentBitboard >> shift;
          currentAttacks |= shiftedBitboard & fileConstraint;
        }
      } else {
        if (((currentBitboard << -shift) & fileConstraint) !== 0n) {
          const shiftedBitboard = currentBitboard << -shift;
          currentAttacks |= shiftedBitboard & fileConstraint;
        }
      }
    }

    return currentAttacks;
  }

  // Getters
  getLeaperOffsets(): number[][][] {
    return this.leaperOffsets;
  }

  getLeaperPieceState(): BigUint64Array[][] {
    return this.leaperPieceState;
  }

  // Setters
  setLeaperOffsets(offsets: number[][][]): void {
    this.leaperOffsets = offsets;
  }

  setLeaperPieceState(state: BigUint64Array[][]): void {
    this.leaperPieceState = state;
  }
}

// Pawn move behavior
export class PawnMoveBehavior implements MoveBehavior {
  private pawnPieceState: BigUint64Array[];

  constructor() {
    this.pawnPieceState = Array.from({ length: 2 }, () => new BigUint64Array(64));
  }

  /** Initialize pawn piece attacks */
  initializeAttacks(): void {
    for (let square = 0; square < 64; square++) {
      this.pawnPieceState[colors.WHITE][square] = this.maskPawnAttacks(colors.WHITE, square);
      this.pawnPieceState[colors.BLACK][square] = this.maskPawnAttacks(colors.BLACK, square);
    }
  }

  /**
   * Get pawn piece attacks. We know occupancy and moveIndex isn't required but is part of the interface.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getAttacks(pos: number, occupancy: bigint, color: number, moveIndex: number): bigint {
    return this.pawnPieceState[color][pos];
  }

  /** Mask pawn attacks */
  private maskPawnAttacks(color: number, pos: number): bigint {
    let currentAttacks = 0n;
    let currentBitboard = 0n;
    currentBitboard = setBit(currentBitboard, pos, true);

    if (color === colors.WHITE) {
      if (((currentBitboard >> 7n) & notAFile) !== 0n) currentAttacks |= currentBitboard >> 7n;
      if (((currentBitboard >> 9n) & notHFile) !== 0n) currentAttacks |= currentBitboard >> 9n;
    } else if (color === colors.BLACK) {
      if (((currentBitboard << 7n) & notHFile) !== 0n) currentAttacks |= currentBitboard << 7n;
      if (((currentBitboard << 9n) & notAFile) !== 0n) currentAttacks |= currentBitboard << 9n;
    }

    return currentAttacks;
  }

  // Getters
  getPawnPieceState(): BigUint64Array[] {
    return this.pawnPieceState;
  }

  // Setters
  setPawnPieceState(state: BigUint64Array[]): void {
    this.pawnPieceState = state;
  }
}

// Sliding move behavior
export class SlidingMoveBehavior implements MoveBehavior {
  private straightConstraints: number[];
  private diagonalConstraints: number[];
  private straight: boolean;
  private diagonal: boolean;
  private straightPieceMask: BigUint64Array;
  private diagonalPieceMask: BigUint64Array;
  private slidingStraightPieceState: BigUint64Array[];
  private slidingDiagonalPieceState: BigUint64Array[];

  constructor(
    straight: boolean,
    diagonal: boolean,
    straightConstraints: number[],
    diagonalConstraints: number[],
  ) {
    this.straight = straight;
    this.diagonal = diagonal;
    this.straightConstraints = straightConstraints;
    this.diagonalConstraints = diagonalConstraints;
    this.straightPieceMask = new BigUint64Array(64);
    this.diagonalPieceMask = new BigUint64Array(64);
    this.slidingStraightPieceState = Array.from({ length: 64 }, () => new BigUint64Array(4096));
    this.slidingDiagonalPieceState = Array.from({ length: 64 }, () => new BigUint64Array(512));
  }

  /** Initialize sliding piece attacks */
  initializeAttacks(): void {
    // Sliding pieces typically initialize their attack tables externally
  }

  /**
   * Get sliding piece attacks. We know color and moveIndex isn't used but is in the interface.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getAttacks(pos: number, occupancy: bigint, color: number, moveIndex: number): bigint {
    let pieceState = 0n;

    if (this.straight) {
      let straightOccupancy = occupancy & this.straightPieceMask[pos];
      straightOccupancy =
        (straightOccupancy * straightMagicNumbers[pos]) >>
        (64n - BigInt(straightRelevantBits[pos]));

      const maskedStraightOccupancy = straightOccupancy & straightBitMask;
      const rawStraightMoves = this.slidingStraightPieceState[pos][Number(maskedStraightOccupancy)];

      pieceState |= applyConstraintsToMoves(rawStraightMoves, this.straightConstraints, pos, true);
    }

    if (this.diagonal) {
      let diagonalOccupancy = occupancy & this.diagonalPieceMask[pos];
      diagonalOccupancy =
        (diagonalOccupancy * diagonalMagicNumbers[pos]) >>
        (64n - BigInt(diagonalRelevantBits[pos]));

      const maskedDiagonalOccupancy = diagonalOccupancy & diagonalBitMask;
      const rawDiagonalMoves = this.slidingDiagonalPieceState[pos][Number(maskedDiagonalOccupancy)];

      pieceState |= applyConstraintsToMoves(rawDiagonalMoves, this.diagonalConstraints, pos, false);
    }

    return pieceState;
  }

  // Getters
  getStraightConstraints(): number[] {
    return this.straightConstraints;
  }

  getDiagonalConstraints(): number[] {
    return this.diagonalConstraints;
  }

  getStraight(): boolean {
    return this.straight;
  }

  getDiagonal(): boolean {
    return this.diagonal;
  }

  getStraightPieceMask(): BigUint64Array {
    return this.straightPieceMask;
  }

  getDiagonalPieceMask(): BigUint64Array {
    return this.diagonalPieceMask;
  }

  getSlidingStraightPieceState(): BigUint64Array[] {
    return this.slidingStraightPieceState;
  }

  getSlidingDiagonalPieceState(): BigUint64Array[] {
    return this.slidingDiagonalPieceState;
  }

  // Setters
  setStraightConstraints(constraints: number[]): void {
    this.straightConstraints = constraints;
  }

  setDiagonalConstraints(constraints: number[]): void {
    this.diagonalConstraints = constraints;
  }

  setStraight(straight: boolean): void {
    this.straight = straight;
  }

  setDiagonal(diagonal: boolean): void {
    this.diagonal = diagonal;
  }

  setStraightPieceMask(mask: BigUint64Array): void {
    this.straightPieceMask = mask;
  }

  setDiagonalPieceMask(mask: BigUint64Array): void {
    this.diagonalPieceMask = mask;
  }

  setSlidingStraightPieceState(state: BigUint64Array[]): void {
    this.slidingStraightPieceState = state;
  }

  setSlidingDiagonalPieceState(state: BigUint64Array[]): void {
    this.slidingDiagonalPieceState = state;
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

  /** Get piece attacks */
  getAttacks(pos: number, occupancy: bigint, moveIndex: number = 0): bigint {
    return this.moveBehavior.getAttacks(pos, occupancy, this.color, moveIndex);
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

class KingPiece extends Piece {
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

class QueenPiece extends Piece {
  constructor(id: number, color: number) {
    super(id, color, new SlidingMoveBehavior(true, true, [8, 8, 8, 8], [8, 8, 8, 8]));
    this.setSlider(true);
  }
}

class RookPiece extends Piece {
  constructor(id: number, color: number) {
    super(id, color, new SlidingMoveBehavior(true, false, [8, 8, 8, 8], []));
    this.setSlider(true);
  }
}

class BishopPiece extends Piece {
  constructor(id: number, color: number) {
    super(id, color, new SlidingMoveBehavior(false, true, [], [8, 8, 8, 8]));
    this.setSlider(true);
  }
}

class KnightPiece extends Piece {
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

class PawnPiece extends Piece {
  constructor(id: number, color: number) {
    super(id, color, new PawnMoveBehavior());
    this.setPawn(true);
    this.setEnpassant(true);
    this.setPromote(true);
  }
}

class BalloonPiece extends Piece {
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

class PogoPiece extends Piece {
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
      default:
        throw new Error(`Unknown piece type: ${type}`);
    }
  }
}

export { Piece, PieceFactory };
