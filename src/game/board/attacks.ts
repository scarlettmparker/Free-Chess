import { BOARD_SIZE, colors, gameState, getBitboard } from '~/game/consts/board';
import { getCheckMove } from '~/game/move/move';
import { lsbIndex } from '~/game/board/bb';
import { SlidingMoveBehavior, LeaperMoveBehavior, PawnMoveBehavior } from '~/game/piece/piece';

/**
 * Function to determine whether a square is attacked by a player.
 * It does this by going through the piece's attack lookup tables for each piece
 * based on the current game's occupancies and piece constraints based on move count.
 *
 * @param pos Square to check if attacked.
 * @param side Chess player (0. white, 1. black).
 * @param currentMove The current move of the board state.
 * @returns True (square is attacked), or false (square is not attacked).
 */
export const isSquareAttacked = (pos: number, side: number) => {
  if (pos == -1) return false;

  const pieces = gameState.pieces;
  const l = pieces.length;
  const bothLo = gameState.occLo[colors.BOTH];
  const bothHi = gameState.occHi[colors.BOTH];
  for (let i = 0; i < l; i++) {
    const piece = pieces[i];
    if (piece.getColor() !== side) continue;

    const pieceBB = getBitboard(piece.getId());
    const pieceLo = pieceBB.lo;
    const pieceHi = pieceBB.hi;
    if (pieceLo === 0 && pieceHi === 0) continue;
    const moveBehavior = piece.getMoveBehavior();
    const oppColor = piece.getColor() ^ 1;

    if (moveBehavior instanceof PawnMoveBehavior) {
      const lo = moveBehavior.getPawnPieceStateLo();
      const hi = moveBehavior.getPawnPieceStateHi();
      if (lo[oppColor][pos] & pieceLo || hi[oppColor][pos] & pieceHi) return true;
    }

    if (moveBehavior instanceof SlidingMoveBehavior) {
      const r = moveBehavior.getSliderAttacksLoHi(pos, bothLo, bothHi);
      if ((r.lo & pieceLo) | (r.hi & pieceHi)) return true;
    }

    if (moveBehavior instanceof LeaperMoveBehavior) {
      const loTbl = moveBehavior.getLeaperPieceStateLo();
      const hiTbl = moveBehavior.getLeaperPieceStateHi();
      let bbLo = pieceLo;
      let bbHi = pieceHi;
      let checkMove = 0;
      let checked = false;

      while (bbLo !== 0 || bbHi !== 0) {
        const sourceSquare = lsbIndex(bbLo, bbHi);
        checkMove = getCheckMove(piece, sourceSquare);

        if (checkMove && checkMove > 0) {
          checked = true;
          if (
            loTbl[oppColor][checkMove][pos] & pieceLo ||
            hiTbl[oppColor][checkMove][pos] & pieceHi
          )
            return true;
        }

        if (sourceSquare < 32) bbLo &= ~(1 << sourceSquare);
        else bbHi &= ~(1 << (sourceSquare - 32));
      }

      if (checkMove == 0 && !checked) {
        if (loTbl[oppColor][0][pos] & pieceLo || hiTbl[oppColor][0][pos] & pieceHi) return true;
      }
    }
  }

  return false;
};

/**
 * Prints attacked squares for a given player.
 * @param side Chess player (0. white, 1. black).
 */
export const printAttackedSquares = (side: number) => {
  let out = '';
  for (let rank = 0; rank < BOARD_SIZE; rank++) {
    for (let file = 0; file < BOARD_SIZE; file++) {
      const square = rank * 8 + file;
      if (!file) out += ` ${8 - rank}`;
      out += `  ${isSquareAttacked(square, side) ? 1 : 0}`;
    }
    out += '\n';
  }
  out += '    a  b  c  d  e  f  g  h';
  console.log(out);
};
