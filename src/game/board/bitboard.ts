import {
  BOARD_SIZE,
  charPieces,
  unicodePieces,
  castlePieces,
  gameState,
  getBitboard,
} from '../consts/board';
import { rawPosToNot } from './squarehelper';

/**
 *
 * @param bitBoard Bitboard to modify.
 * @param pos Position (e.g. a1) on a Chess board.
 * @param push True: sets to 1, False: sets to 0.
 * @returns Updated bitboard.
 */
function setBit(bitboard: bigint, pos: number, push: boolean) {
  if (push) {
    return bitboard | (1n << BigInt(pos));
  } else {
    return bitboard & ~(1n << BigInt(pos));
  }
}

/**
 *
 * @param bitboard Bitboard to get value from.
 * @param pos Position (e.g. a1) on a Chess board.
 * @returns Bit at position in bitboard.
 */
export function getBit(bitboard: bigint, pos: number) {
  // shift bit board by index pos & mask with 1
  const bit = (bitboard >> BigInt(pos)) & 1n;
  return Number(bit);
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
  while (bitboard > 0n) {
    const chunk = Number(bitboard & 0xffn);
    count += BIT_COUNT_LOOKUP[chunk];
    bitboard >>= 8n;
  }
  return count;
}

/**
 *
 * @param bitboard Bitboard to get LFSB from.
 * @returns Least significant 1st bit index.
 */
export function getLSFBIndex(bitboard: bigint) {
  if (bitboard > 0n) {
    return countBits((bitboard & -bitboard) - 1n);
  } else {
    return -1; // illegal index
  }
}

/**
 * Prints out a bitboard and its current BigInt value.
 * @param bitboard Bitboard to print.
 */
export function printBitboard(bitboard: bigint) {
  let grid: string[] = [];

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
      for (let bbPiece of gameState.whitePieceIds) {
        if (getBit(getBitboard(bbPiece).bitboard, square)) {
          piece = bbPiece;
        }
      }

      for (let bbPiece of gameState.blackPieceIds) {
        if (getBit(getBitboard(bbPiece).bitboard, square)) {
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

export const getPieceByID = (id: number) => {
  return gameState.pieces.find((piece) => piece.id === id);
};

/**
 *
 * @param castle Current castling rights for all players.
 * @returns Formatted castling rights (e.g. KQkq).
 */
function getCastling(castle: bigint) {
  const rights = [];

  if (castle & BigInt(castlePieces.wk)) rights.push('K');
  if (castle & BigInt(castlePieces.wq)) rights.push('Q');
  if (castle & BigInt(castlePieces.bk)) rights.push('k');
  if (castle & BigInt(castlePieces.bq)) rights.push('q');

  return rights.join('');
}

export default setBit;
