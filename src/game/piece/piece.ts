import {
  straightRelevantBits,
  straightBitMask,
  diagonalRelevantBits,
  diagonalBitMask,
} from '../consts/bits';
import { colors, notAFile, notHFile } from '../consts/board';
import { straightMagicNumbers, diagonalMagicNumbers } from '../consts/magic';
import { applyConstraintsToMoves } from '../init/slidingpiece';
import setBit from '../board/bitboard';
import { getFileConstraint } from '../board/squarehelper';

export class Piece {
  id: number;
  color: number;
  move: number;

  globalEffect: boolean;
  firstMove: number;

  king: boolean;
  pawn: boolean;
  enpassant: boolean;
  promote: boolean;

  slider: boolean;
  leaper: boolean;
  rotationalMoveType: string;

  leaperOffsets: number[][][];
  straightConstraints: number[];
  diagonalConstraints: number[];

  straight: boolean;
  diagonal: boolean;

  pieceMask: BigUint64Array;
  straightPieceMask: BigUint64Array;
  diagonalPieceMask: BigUint64Array;

  slidingDiagonalPieceState: BigUint64Array[];
  slidingStraightPieceState: BigUint64Array[];

  leaperPieceState: BigUint64Array[][];
  pawnPieceState: BigUint64Array[];

  constructor(id: number, color: number) {
    this.id = id;
    this.color = color;
    this.move = 0;

    this.globalEffect = false;
    this.firstMove = -1;

    // fun functional stuff to mess around with
    this.king = false;
    this.pawn = false;
    this.enpassant = false;
    this.promote = false;

    this.slider = false;
    this.leaper = false;
    this.rotationalMoveType = 'DEFAULT';

    this.straightConstraints = [];
    this.diagonalConstraints = [];
    this.leaperOffsets = [];

    this.straight = false;
    this.diagonal = false;

    this.pieceMask = new BigUint64Array(64);
    this.straightPieceMask = new BigUint64Array(64);
    this.diagonalPieceMask = new BigUint64Array(64);

    this.slidingDiagonalPieceState = Array.from({ length: 64 }, () => new BigUint64Array(512));
    this.slidingStraightPieceState = Array.from({ length: 64 }, () => new BigUint64Array(4096));
    this.leaperPieceState = Array.from({ length: 2 }, () =>
      Array.from({ length: this.leaperOffsets.length }, () => new BigUint64Array(64)),
    );

    this.pawnPieceState = Array.from({ length: 2 }, () => new BigUint64Array(64));
  }

  /**
   * Function to mask a piece's leaper attacks.
   *
   * @param pos Position on the bitboard.
   * @param offsets Offset values from the piece's position to determine leaping moves.
   * @returns Attack bitboard for a leaper piece on a specified square;
   */
  maskLeaperAttacks = (pos: number, offsets: number[][], color: number) => {
    let currentAttacks = 0n;
    let currentBitboard = 0n;
    currentBitboard = setBit(currentBitboard, pos, true);
    const isBlack = color == colors.BLACK;

    for (let [fileOffset, rankOffset] of offsets) {
      if (isBlack) {
        fileOffset = -fileOffset;
        rankOffset = -rankOffset;
      }

      const shift = BigInt(rankOffset * 8 - fileOffset);
      const fileConstraint = getFileConstraint(fileOffset);

      if (shift > 0n) {
        // for positive shifts (rightward)
        if (((currentBitboard >> shift) & fileConstraint) !== 0n) {
          const shiftedBitboard = currentBitboard >> shift;
          currentAttacks |= shiftedBitboard & fileConstraint;
        }
      } else {
        // for negative shifts (leftward)
        if (((currentBitboard << -shift) & fileConstraint) !== 0n) {
          const shiftedBitboard = currentBitboard << -shift;
          currentAttacks |= shiftedBitboard & fileConstraint;
        }
      }
    }

    return currentAttacks;
  };

  /**
   *
   */
  maskPawnAttacks = (color: number, pos: number) => {
    let currentAttacks = 0n;
    let currentBitboard = 0n;
    currentBitboard = setBit(currentBitboard, pos, true);

    // white pawns
    if (this.pawn && color == 0) {
      if (((currentBitboard >> 7n) & notAFile) !== 0n) currentAttacks |= currentBitboard >> 7n;
      if (((currentBitboard >> 9n) & notHFile) !== 0n) currentAttacks |= currentBitboard >> 9n;
      // black pawns
    } else if (this.pawn && color == 1) {
      if (((currentBitboard << 7n) & notHFile) !== 0n) currentAttacks |= currentBitboard << 7n;
      if (((currentBitboard << 9n) & notAFile) !== 0n) currentAttacks |= currentBitboard << 9n;
    }

    return currentAttacks;
  };

  /**
   * Function to return a sliding piece's attacks.
   *
   * @param pos Position on the bitboard.
   * @param occupancy Current occupancy of the board.
   * @param straightConstraints Constraints for straight moves.
   * @param diagonalConstraints Constraints for diagonal moves.
   * @returns A bitboard representing squares attacked by the piece.
   */
  getSlidingPieceAttacks = (
    pos: number,
    occupancy: bigint,
    straightConstraints: number[],
    diagonalConstraints: number[],
  ) => {
    let pieceState = 0n;

    // straight constraints (rook-like moves)
    if (this.straight) {
      let straightOccupancy = occupancy & this.straightPieceMask[pos];
      straightOccupancy =
        (straightOccupancy * straightMagicNumbers[pos]) >>
        (64n - BigInt(straightRelevantBits[pos]));

      const maskedStraightOccupancy = straightOccupancy & straightBitMask;
      const rawStraightMoves =
        this.getSlidingStraightPieceState()[pos][Number(maskedStraightOccupancy)];

      pieceState |= applyConstraintsToMoves(rawStraightMoves, straightConstraints, pos, true);
    }

    // diagonal constraints (bishop-like moves)
    if (this.diagonal) {
      let diagonalOccupancy = occupancy & this.diagonalPieceMask[pos];
      diagonalOccupancy =
        (diagonalOccupancy * diagonalMagicNumbers[pos]) >>
        (64n - BigInt(diagonalRelevantBits[pos]));

      const maskedDiagonalOccupancy = diagonalOccupancy & diagonalBitMask;
      const rawDiagonalMoves =
        this.getSlidingDiagonalPieceState()[pos][Number(maskedDiagonalOccupancy)];

      pieceState |= applyConstraintsToMoves(rawDiagonalMoves, diagonalConstraints, pos, false);
    }

    return pieceState;
  };

  /**
   * Function that initializes piece attacks for leaper pieces.
   */
  initLeaperAttacks = () => {
    const pieceState = Array.from({ length: 2 }, () =>
      Array.from({ length: this.leaperOffsets.length }, () => new BigUint64Array(64)),
    );

    for (let i = 0; i < this.leaperOffsets.length; i++) {
      for (let square = 0; square < 64; square++) {
        pieceState[colors.WHITE][i][square] = this.maskLeaperAttacks(
          square,
          this.leaperOffsets[i],
          colors.WHITE,
        );
        pieceState[colors.BLACK][i][square] = this.maskLeaperAttacks(
          square,
          this.leaperOffsets[i],
          colors.BLACK,
        );
      }
    }

    this.setLeaperPieceState(pieceState);
  };

  /**
   * Function that initializes piece attacks for pawn pieces.
   */
  initPawnAttacks = () => {
    const pieceState = this.getPawnPieceState();

    for (let square = 0; square < 64; square++) {
      pieceState[colors.WHITE][square] = this.maskPawnAttacks(colors.WHITE, square);
      pieceState[colors.BLACK][square] = this.maskPawnAttacks(colors.BLACK, square);
    }

    this.setPawnPieceState(pieceState);
  };

  // getters
  getID = () => {
    return this.id;
  };

  getColor = () => {
    return this.color;
  };

  getMove = () => {
    return this.move;
  };

  getKing = () => {
    return this.king;
  };

  getPawn = () => {
    return this.pawn;
  };

  getEnpassant = () => {
    return this.enpassant;
  };

  getPromote = () => {
    return this.promote;
  };

  getSlider = () => {
    return this.slider;
  };

  getLeaper = () => {
    return this.leaper;
  };

  getRotationalMoveType = () => {
    return this.rotationalMoveType;
  };

  getPieceMask = () => {
    return this.pieceMask;
  };

  getStraightPieceMask = () => {
    return this.straightPieceMask;
  };

  getDiagonalPieceMask = () => {
    return this.diagonalPieceMask;
  };

  getSlidingStraightPieceState = () => {
    return this.slidingStraightPieceState;
  };

  getSlidingDiagonalPieceState = () => {
    return this.slidingDiagonalPieceState;
  };

  getLeaperPieceState = () => {
    return this.leaperPieceState;
  };

  getLeaperPieceStateMove = (move: number) => {
    return this.leaperPieceState[move];
  };

  getPawnPieceState = () => {
    return this.pawnPieceState;
  };

  // setters
  setMove = (move: number) => {
    this.move = move;
  };

  setKing = (king: boolean) => {
    this.king = king;
  };

  setPawn = (pawn: boolean) => {
    this.pawn = pawn;
  };

  setEnpassant = (enpassant: boolean) => {
    this.enpassant = enpassant;
  };

  setPromote = (promote: boolean) => {
    this.promote = promote;
  };

  setSlider = (slider: boolean) => {
    this.slider = slider;
  };

  setLeaper = (leaper: boolean) => {
    this.leaper = leaper;
  };

  setRotationalMoveType = (rotationalMoveType: string) => {
    this.rotationalMoveType = rotationalMoveType;
  };

  setLeaperOffsets = (leaperOffsets: number[][][]) => {
    this.leaperOffsets = leaperOffsets;
  };

  setStraightConstraints = (straightConstraints: number[]) => {
    this.straightConstraints = straightConstraints;
  };

  setDiagonalConstraints = (diagonalConstraints: number[]) => {
    this.diagonalConstraints = diagonalConstraints;
  };

  setStraight = (straight: boolean) => {
    this.straight = straight;
  };

  setDiagonal = (diagonal: boolean) => {
    this.diagonal = diagonal;
  };

  setPieceMask = (pieceMask: BigUint64Array) => {
    this.pieceMask = pieceMask;
  };

  setStraightPieceMask = (pieceMask: BigUint64Array) => {
    this.straightPieceMask = pieceMask;
  };

  setDiagonalPieceMask = (pieceMask: BigUint64Array) => {
    this.diagonalPieceMask = pieceMask;
  };

  setSlidingStraightPieceState = (pieceState: BigUint64Array[]) => {
    this.slidingStraightPieceState = pieceState;
  };

  setSlidingDiagonalPieceState = (pieceState: BigUint64Array[]) => {
    this.slidingDiagonalPieceState = pieceState;
  };

  setLeaperPieceState = (pieceState: BigUint64Array[][]) => {
    this.leaperPieceState = pieceState;
  };

  setPawnPieceState = (pieceState: BigUint64Array[]) => {
    this.pawnPieceState = pieceState;
  };
}
