import {
  BOARD_SIZE,
  unicodePieces,
  castlePieces,
  gameState,
  getBitboard,
} from '~/game/consts/board';
import { rawPosToNot } from './square-helper';

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
