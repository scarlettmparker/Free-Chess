import {
  BOARD_SIZE,
  unicodePieces,
  castlePieces,
  gameState,
  getBitboard,
} from '~/game/consts/board';
import { rawPosToNot } from './square-helper';

/** Precomputed single-bit and cleared-bit bigint masks (avoid `1n << BigInt(pos)` in hot paths). */
export const BIT: bigint[] = Array.from({ length: 64 }, (_, i) => 1n << BigInt(i));
export const NOT_BIT: bigint[] = BIT.map((b) => ~b);

/**
 *
 * @param bitBoard Bitboard to modify.
 * @param pos Position (e.g. a1) on a Chess board.
 * @param push True: sets to 1, False: sets to 0.
 * @returns Updated bitboard.
 */
function setBit(bitboard: bigint, pos: number, push: boolean) {
  return push ? bitboard | BIT[pos] : bitboard & NOT_BIT[pos];
}

/**
 *
 * @param bitboard Bitboard to get value from.
 * @param pos Position (e.g. a1) on a Chess board.
 * @returns Bit at position in bitboard.
 */
export function getBit(lo: number, hi: number, pos: number) {
  return pos < 32 ? (lo >>> pos) & 1 : (hi >>> (pos - 32)) & 1;
}

/**
 * Mutates a stored lo/hi bitboard in place: sets or clears the bit at `pos`.
 */
export function setBitLoHi(bb: { lo: number; hi: number }, pos: number, on: boolean) {
  if (pos < 32) {
    const m = 1 << pos;
    if (on) bb.lo |= m;
    else bb.lo &= ~m;
  } else {
    const m = 1 << (pos - 32);
    if (on) bb.hi |= m;
    else bb.hi &= ~m;
  }
}

const BIT_COUNT_LOOKUP: number[] = Array(256)
  .fill(0)
  .map((_, i) => {
    let count = 0;
    let num = i;
    while (num) {
      num &= num - 1;
      count++;
    }
    return count;
  });

/**
 *
 * @param bitboard Bitboard to count.
 * @returns Number of bits available on the bitboard.
 */
export function countBits(bitboard: bigint): number {
  let count = 0;
  // low 32 bits via Number popcount, then high bits
  let lo = Number(bitboard & 0xffffffffn) >>> 0;
  while (lo !== 0) {
    count += BIT_COUNT_LOOKUP[lo & 0xff];
    lo >>>= 8;
  }
  let hi = Number(bitboard >> 32n) >>> 0;
  while (hi !== 0) {
    count += BIT_COUNT_LOOKUP[hi & 0xff];
    hi >>>= 8;
  }
  return count;
}

/**
 *
 * @param bitboard Bitboard to get LFSB from.
 * @returns Least significant 1st bit index.
 */
export function getLSFBIndex(bitboard: bigint) {
  if (bitboard === 0n) return -1;
  const lo = Number(bitboard & 0xffffffffn) >>> 0;
  if (lo !== 0) return Math.clz32(lo & -lo) ^ 31;
  const hi = Number(bitboard >> 32n) >>> 0;
  return 32 + (Math.clz32(hi & -hi) ^ 31);
}

/**
 * Prints out a bitboard and its current BigInt value.
 * @param bitboard Bitboard to print.
 */
export function printBitboard(bitboard: bigint) {
  const grid: string[] = [];

  for (let i = 0; i < 8; i++) {
    let row = ' ';
    for (let j = 7; j >= 0; j--) {
      const index = i * 8 + (7 - j);
      if ((bitboard & (1n << BigInt(index))) !== 0n) {
        row += '1 ';
      } else {
        row += '0 ';
      }
    }
    grid.push(row.trim());
  }

  console.log(grid);
  console.log(bitboard);
}

/**
 * Prints the current state of the Chess board.
 * @param bitboards Bitboards to consider when printing.
 * @param side Current player to move (0. white, 1. black).
 * @param enpassant Current enpassant square if valid.
 * @param castle Castling rights per player.
 */
export const printBoard = () => {
  let board = '';
  for (let rank = 0; rank < BOARD_SIZE; rank++) {
    board += `${8 - rank}  `;

    for (let file = 0; file < BOARD_SIZE; file++) {
      const square = rank * BOARD_SIZE + file;
      let piece = -1;

      // loop over all piece bitboards
      for (const bbPiece of gameState.whitePieceIds) {
        const bb = getBitboard(bbPiece);
        if (getBit(bb.lo, bb.hi, square)) {
          piece = bbPiece;
        }
      }

      for (const bbPiece of gameState.blackPieceIds) {
        const bb = getBitboard(bbPiece);
        if (getBit(bb.lo, bb.hi, square)) {
          piece = bbPiece;
        }
      }

      board += `${piece == -1 ? '. ' : unicodePieces[piece]} `;
    }
    board += '\n';
  }

  board += '   a  b  c  d  e  f  g  h\n\n';
  board += `   Side to move: ${gameState.side == 0 ? 'white' : 'black'}\n`;
  board += `   En passant: ${
    gameState.enpassant >= 0 ? rawPosToNot[gameState.enpassant] : 'none'
  }\n`;
  board += `   Castle: ${getCastling(gameState.castle)}`;
  console.log(board);
};

export const getPieceById = (id: number) => {
  return gameState.pieces.find((piece) => piece.getId() === id);
};

/**
 *
 * @param castle Current castling rights for all players.
 * @returns Formatted castling rights (e.g. KQkq).
 */
function getCastling(castle: number) {
  const rights = [];

  if (castle & castlePieces.wk) rights.push('K');
  if (castle & castlePieces.wq) rights.push('Q');
  if (castle & castlePieces.bk) rights.push('k');
  if (castle & castlePieces.bq) rights.push('q');

  return rights.join('');
}

export default setBit;
