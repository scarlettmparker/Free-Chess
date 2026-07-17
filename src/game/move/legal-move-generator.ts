import {
  blackPromotions,
  castlePieces,
  colors,
  gameState,
  getBitboard,
  whitePromotions,
} from '~/game/consts/board';
import {
  Piece,
  SlidingMoveBehavior,
  LeaperMoveBehavior,
  PawnMoveBehavior,
} from '~/game/piece/piece';
import { isSquareAttacked } from '~/game/board/attacks';
import { getBit, getLSFBIndex } from '~/game/board/bitboard';
import { lsbIndex } from '~/game/board/bb';
import { notToRawPos } from '~/game/board/square-helper';
import { addMove, getCheckMove } from './move';
import { encodeMove, MoveList } from './move-def';

/**
 * Generates moves for all pieces of the current side.
 * @param moves Move list to add generated moves to.
 * @param pieces List of pieces to generate moves for.
 */
export const generateMoves = (moves: MoveList, pieces: Piece[]) => {
  const l = pieces.length;
  for (let i = 0; i < l; i++) {
    const piece = pieces[i];
    if (piece.getColor() !== gameState.side) continue;
    generateMove(moves, piece);
  }
};

/**
 * Generates moves for a specific piece.
 * @param movesCopy Move list to add generated moves to.
 * @param piece Piece to generate moves for.
 */
export const generateMove = (movesCopy: MoveList, piece: Piece) => {
  let targetSquare: number;
  const moveBehavior = piece.getMoveBehavior();

  const pieceBB = getBitboard(piece.getId());
  let sourceSquare = lsbIndex(pieceBB.lo, pieceBB.hi);

  if (piece.getColor() === colors.WHITE && moveBehavior instanceof PawnMoveBehavior) {
    const bothLo = gameState.occLo[colors.BOTH];
    const bothHi = gameState.occHi[colors.BOTH];
    const oppLo = gameState.occLo[colors.BLACK];
    const oppHi = gameState.occHi[colors.BLACK];
    let bbLo = pieceBB.lo;
    let bbHi = pieceBB.hi;

    while (bbLo !== 0 || bbHi !== 0) {
      sourceSquare = lsbIndex(bbLo, bbHi);
      targetSquare = sourceSquare - 8;
      const targetFree =
        targetSquare < 32
          ? !((bothLo >>> targetSquare) & 1)
          : !((bothHi >>> (targetSquare - 32)) & 1);
      if (!(targetSquare < notToRawPos['a8']) && targetFree) {
        if (sourceSquare >= notToRawPos['a7'] && sourceSquare <= notToRawPos['h7']) {
          if (piece.getPromote()) {
            whitePromotions.forEach((promotePiece) => {
              addMove(
                movesCopy,
                encodeMove(sourceSquare, targetSquare, piece.getId(), promotePiece, 0, 0, 0, 0),
              );
            });
          }
        } else {
          // one square ahead push
          addMove(movesCopy, encodeMove(sourceSquare, targetSquare, piece.getId(), 0, 0, 0, 0, 0));
          if (sourceSquare >= notToRawPos['a2'] && sourceSquare <= notToRawPos['h2']) {
            const t2 = targetSquare - 8;
            const t2Free =
              t2 < 32 ? !((bothLo >>> t2) & 1) : !((bothHi >>> (t2 - 32)) & 1);
            if (t2Free) {
              addMove(movesCopy, encodeMove(sourceSquare, t2, piece.getId(), 0, 0, 1, 0, 0));
            }
          }
        }
      }

      // pawn captures (mask with opponent occupancy in Number)
      let alo = moveBehavior.getPawnPieceStateLo()[gameState.side][sourceSquare] & oppLo;
      let ahi = moveBehavior.getPawnPieceStateHi()[gameState.side][sourceSquare] & oppHi;
      while (alo !== 0 || ahi !== 0) {
        targetSquare = lsbIndex(alo, ahi);
        // pawn capture promotion
        if (sourceSquare >= notToRawPos['a7'] && sourceSquare <= notToRawPos['h7']) {
          if (piece.getPromote()) {
            whitePromotions.forEach((promotePiece) => {
              addMove(
                movesCopy,
                encodeMove(sourceSquare, targetSquare, piece.getId(), promotePiece, 1, 0, 0, 0),
              );
            });
          }
        } else {
          addMove(movesCopy, encodeMove(sourceSquare, targetSquare, piece.getId(), 0, 1, 0, 0, 0));
        }
        if (targetSquare < 32) alo &= ~(1 << targetSquare);
        else ahi &= ~(1 << (targetSquare - 32));
      }

      if (gameState.enpassant != -1) {
        const enpassantAttacks =
          moveBehavior.getPawnPieceState()[gameState.side][sourceSquare] &
          (1n << BigInt(gameState.enpassant));
        if (enpassantAttacks) {
          const targetEnpassant = getLSFBIndex(enpassantAttacks);
          addMove(
            movesCopy,
            encodeMove(sourceSquare, targetEnpassant, piece.getId(), 0, 1, 0, 1, 0),
          );
        }
      }

      if (sourceSquare < 32) bbLo &= ~(1 << sourceSquare);
      else bbHi &= ~(1 << (sourceSquare - 32));
    }
  }

  if (piece.getColor() === colors.WHITE && piece.getKing()) {
    if (gameState.castle & castlePieces.wk) {
      if (
        !getBit(gameState.occLo[colors.BOTH], gameState.occHi[colors.BOTH],notToRawPos['f1']) &&
        !getBit(gameState.occLo[colors.BOTH], gameState.occHi[colors.BOTH],notToRawPos['g1'])
      ) {
        if (
          !isSquareAttacked(notToRawPos['e1'], colors.BLACK) &&
          !isSquareAttacked(notToRawPos['f1'], colors.BLACK)
        ) {
          addMove(
            movesCopy,
            encodeMove(notToRawPos['e1'], notToRawPos['g1'], piece.getId(), 0, 0, 0, 0, 1),
          );
        }
      }
    }

    // queen side
    if (gameState.castle & castlePieces.wq) {
      if (
        !getBit(gameState.occLo[colors.BOTH], gameState.occHi[colors.BOTH],notToRawPos['d1']) &&
        !getBit(gameState.occLo[colors.BOTH], gameState.occHi[colors.BOTH],notToRawPos['c1']) &&
        !getBit(gameState.occLo[colors.BOTH], gameState.occHi[colors.BOTH],notToRawPos['b1'])
      ) {
        if (
          !isSquareAttacked(notToRawPos['e1'], colors.BLACK) &&
          !isSquareAttacked(notToRawPos['d1'], colors.BLACK)
        ) {
          addMove(
            movesCopy,
            encodeMove(notToRawPos['e1'], notToRawPos['c1'], piece.getId(), 0, 0, 0, 0, 1),
          );
        }
      }
    }
  }

  if (piece.getColor() === colors.BLACK && moveBehavior instanceof PawnMoveBehavior) {
    const bothLo = gameState.occLo[colors.BOTH];
    const bothHi = gameState.occHi[colors.BOTH];
    const oppLo = gameState.occLo[colors.WHITE];
    const oppHi = gameState.occHi[colors.WHITE];
    let bbLo = pieceBB.lo;
    let bbHi = pieceBB.hi;

    while (bbLo !== 0 || bbHi !== 0) {
      sourceSquare = lsbIndex(bbLo, bbHi);
      targetSquare = sourceSquare + 8;
      const targetFree =
        targetSquare < 32
          ? !((bothLo >>> targetSquare) & 1)
          : !((bothHi >>> (targetSquare - 32)) & 1);
      if (!(targetSquare > notToRawPos['h1']) && targetFree) {
        // pawn promotion
        if (sourceSquare >= notToRawPos['a2'] && sourceSquare <= notToRawPos['h2']) {
          if (piece.getPromote()) {
            blackPromotions.forEach((promotePiece) => {
              addMove(
                movesCopy,
                encodeMove(sourceSquare, targetSquare, piece.getId(), promotePiece, 0, 0, 0, 0),
              );
            });
          }
        } else {
          addMove(movesCopy, encodeMove(sourceSquare, targetSquare, piece.getId(), 0, 0, 0, 0, 0));
          if (sourceSquare >= notToRawPos['a7'] && sourceSquare <= notToRawPos['h7']) {
            const t2 = targetSquare + 8;
            const t2Free = t2 < 32 ? !((bothLo >>> t2) & 1) : !((bothHi >>> (t2 - 32)) & 1);
            if (t2Free) {
              addMove(movesCopy, encodeMove(sourceSquare, t2, piece.getId(), 0, 0, 1, 0, 0));
            }
          }
        }
      }

      // initialize pawn attacks bitboard (mask with opponent occupancy in Number)
      let alo = moveBehavior.getPawnPieceStateLo()[gameState.side][sourceSquare] & oppLo;
      let ahi = moveBehavior.getPawnPieceStateHi()[gameState.side][sourceSquare] & oppHi;
      while (alo !== 0 || ahi !== 0) {
        targetSquare = lsbIndex(alo, ahi);
        // pawn capture promotion
        if (sourceSquare >= notToRawPos['a2'] && sourceSquare <= notToRawPos['h2']) {
          if (piece.getPromote()) {
            blackPromotions.forEach((promotePiece) => {
              addMove(
                movesCopy,
                encodeMove(sourceSquare, targetSquare, piece.getId(), promotePiece, 1, 0, 0, 0),
              );
            });
          }
        } else {
          addMove(movesCopy, encodeMove(sourceSquare, targetSquare, piece.getId(), 0, 1, 0, 0, 0));
        }
        if (targetSquare < 32) alo &= ~(1 << targetSquare);
        else ahi &= ~(1 << (targetSquare - 32));
      }

      if (gameState.enpassant != -1) {
        const enpassantAttacks =
          moveBehavior.getPawnPieceState()[gameState.side][sourceSquare] &
          (1n << BigInt(gameState.enpassant));
        if (enpassantAttacks) {
          const targetEnpassant = getLSFBIndex(enpassantAttacks);
          addMove(
            movesCopy,
            encodeMove(sourceSquare, targetEnpassant, piece.getId(), 0, 1, 0, 1, 0),
          );
        }
      }
      if (sourceSquare < 32) bbLo &= ~(1 << sourceSquare);
      else bbHi &= ~(1 << (sourceSquare - 32));
    }
  }

  if (piece.getColor() === colors.BLACK && piece.getKing()) {
    if (gameState.castle & castlePieces.bk) {
      if (
        !getBit(gameState.occLo[colors.BOTH], gameState.occHi[colors.BOTH],notToRawPos['f8']) &&
        !getBit(gameState.occLo[colors.BOTH], gameState.occHi[colors.BOTH],notToRawPos['g8'])
      ) {
        if (
          !isSquareAttacked(notToRawPos['e8'], colors.WHITE) &&
          !isSquareAttacked(notToRawPos['f8'], colors.WHITE)
        ) {
          addMove(
            movesCopy,
            encodeMove(notToRawPos['e8'], notToRawPos['g8'], piece.getId(), 0, 0, 0, 0, 1),
          );
        }
      }
    }

    // queen side
    if (gameState.castle & castlePieces.bq) {
      if (
        !getBit(gameState.occLo[colors.BOTH], gameState.occHi[colors.BOTH],notToRawPos['d8']) &&
        !getBit(gameState.occLo[colors.BOTH], gameState.occHi[colors.BOTH],notToRawPos['c8']) &&
        !getBit(gameState.occLo[colors.BOTH], gameState.occHi[colors.BOTH],notToRawPos['b8'])
      ) {
        if (
          !isSquareAttacked(notToRawPos['e8'], colors.WHITE) &&
          !isSquareAttacked(notToRawPos['d8'], colors.WHITE)
        ) {
          addMove(
            movesCopy,
            encodeMove(notToRawPos['e8'], notToRawPos['c8'], piece.getId(), 0, 0, 0, 0, 1),
          );
        }
      }
    }
  }

  if (moveBehavior instanceof LeaperMoveBehavior || moveBehavior instanceof SlidingMoveBehavior) {
    const side = gameState.side;
    const ownLo =
      side == colors.WHITE ? gameState.occLo[colors.WHITE] : gameState.occLo[colors.BLACK];
    const ownHi =
      side == colors.WHITE ? gameState.occHi[colors.WHITE] : gameState.occHi[colors.BLACK];
    const oppLo =
      side == colors.WHITE ? gameState.occLo[colors.BLACK] : gameState.occLo[colors.WHITE];
    const oppHi =
      side == colors.WHITE ? gameState.occHi[colors.BLACK] : gameState.occHi[colors.WHITE];
    const notOwnLo = ~ownLo;
    const notOwnHi = ~ownHi;
    const bothLo = gameState.occLo[colors.BOTH];
    const bothHi = gameState.occHi[colors.BOTH];

    // source-scan and target-drain in pure Number (lo/hi); bigint only for table reads.
    let bbLo = pieceBB.lo;
    let bbHi = pieceBB.hi;

    while (bbLo !== 0 || bbHi !== 0) {
      sourceSquare = lsbIndex(bbLo, bbHi);
      const checkMove = getCheckMove(piece, sourceSquare);

      // accumulate this source's raw attack set directly in lo/hi (no bigint in the loop)
      let alo = 0;
      let ahi = 0;
      if (moveBehavior instanceof LeaperMoveBehavior) {
        const color = piece.getColor();
        alo |= moveBehavior.getLeaperPieceStateLo()[color][checkMove][sourceSquare];
        ahi |= moveBehavior.getLeaperPieceStateHi()[color][checkMove][sourceSquare];
      }
      if (moveBehavior instanceof SlidingMoveBehavior) {
        const r = moveBehavior.getSliderAttacksLoHi(sourceSquare, bothLo, bothHi);
        alo |= r.lo;
        ahi |= r.hi;
      }

      alo &= notOwnLo;
      ahi &= notOwnHi;

      while (alo !== 0 || ahi !== 0) {
        targetSquare = lsbIndex(alo, ahi);
        const isCapture =
          targetSquare < 32
            ? (oppLo >>> targetSquare) & 1
            : (oppHi >>> (targetSquare - 32)) & 1;
        addMove(
          movesCopy,
          encodeMove(sourceSquare, targetSquare, piece.getId(), 0, isCapture ? 1 : 0, 0, 0, 0),
        );
        if (targetSquare < 32) alo &= ~(1 << targetSquare);
        else ahi &= ~(1 << (targetSquare - 32));
      }

      if (sourceSquare < 32) bbLo &= ~(1 << sourceSquare);
      else bbHi &= ~(1 << (sourceSquare - 32));
    }
  }
};
