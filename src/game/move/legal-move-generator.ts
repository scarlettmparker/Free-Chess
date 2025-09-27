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
  let bitboard, attacks;
  const moveBehavior = piece.getMoveBehavior();

  bitboard = getBitboard(piece.getId()).bitboard;
  let sourceSquare = getLSFBIndex(bitboard);

  if (piece.getColor() === colors.WHITE && moveBehavior instanceof PawnMoveBehavior) {
    while (bitboard > 0n) {
      sourceSquare = getLSFBIndex(bitboard);
      targetSquare = sourceSquare - 8;
      if (
        !(targetSquare < notToRawPos['a8']) &&
        !getBit(gameState.occupancies[colors.BOTH], targetSquare)
      ) {
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
          if (
            sourceSquare >= notToRawPos['a2'] &&
            sourceSquare <= notToRawPos['h2'] &&
            !getBit(gameState.occupancies[colors.BOTH], targetSquare - 8)
          ) {
            addMove(
              movesCopy,
              encodeMove(sourceSquare, targetSquare - 8, piece.getId(), 0, 0, 1, 0, 0),
            );
          }
        }
      }

      // initialize pawn attacks bitboard
      attacks =
        moveBehavior.getPawnPieceState()[gameState.side][sourceSquare] &
        gameState.occupancies[colors.BLACK];
      while (attacks > 0n) {
        targetSquare = getLSFBIndex(attacks);
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
        attacks &= ~(1n << BigInt(targetSquare));
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

      bitboard &= ~(1n << BigInt(sourceSquare));
    }
  }

  if (piece.getColor() === colors.WHITE && piece.getKing()) {
    if (gameState.castle & BigInt(castlePieces.wk)) {
      if (
        !getBit(gameState.occupancies[colors.BOTH], notToRawPos['f1']) &&
        !getBit(gameState.occupancies[colors.BOTH], notToRawPos['g1'])
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
    if (gameState.castle & BigInt(castlePieces.wq)) {
      if (
        !getBit(gameState.occupancies[colors.BOTH], notToRawPos['d1']) &&
        !getBit(gameState.occupancies[colors.BOTH], notToRawPos['c1']) &&
        !getBit(gameState.occupancies[colors.BOTH], notToRawPos['b1'])
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
    while (bitboard > 0n) {
      sourceSquare = getLSFBIndex(bitboard);
      targetSquare = sourceSquare + 8;
      if (
        !(targetSquare > notToRawPos['h1']) &&
        !getBit(gameState.occupancies[colors.BOTH], targetSquare)
      ) {
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
          if (
            sourceSquare >= notToRawPos['a7'] &&
            sourceSquare <= notToRawPos['h7'] &&
            !getBit(gameState.occupancies[colors.BOTH], targetSquare + 8)
          ) {
            addMove(
              movesCopy,
              encodeMove(sourceSquare, targetSquare + 8, piece.getId(), 0, 0, 1, 0, 0),
            );
          }
        }
      }

      // initialize pawn attacks bitboard
      attacks =
        moveBehavior.getPawnPieceState()[gameState.side][sourceSquare] &
        gameState.occupancies[colors.WHITE];
      while (attacks > 0n) {
        targetSquare = getLSFBIndex(attacks);
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
        attacks &= ~(1n << BigInt(targetSquare));
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
      bitboard &= ~(1n << BigInt(sourceSquare));
    }
  }

  if (piece.getColor() === colors.BLACK && piece.getKing()) {
    if (gameState.castle & BigInt(castlePieces.bk)) {
      if (
        !getBit(gameState.occupancies[colors.BOTH], notToRawPos['f8']) &&
        !getBit(gameState.occupancies[colors.BOTH], notToRawPos['g8'])
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
    if (gameState.castle & BigInt(castlePieces.bq)) {
      if (
        !getBit(gameState.occupancies[colors.BOTH], notToRawPos['d8']) &&
        !getBit(gameState.occupancies[colors.BOTH], notToRawPos['c8']) &&
        !getBit(gameState.occupancies[colors.BOTH], notToRawPos['b8'])
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
    let checkMove = 0;
    let attacks = 0n;

    while (bitboard > 0n) {
      sourceSquare = getLSFBIndex(bitboard);
      checkMove = getCheckMove(piece, sourceSquare);

      // get leaper moves
      if (moveBehavior instanceof LeaperMoveBehavior) {
        attacks |=
          moveBehavior.getLeaperPieceState()[piece.getColor()][checkMove][sourceSquare] &
          (piece.getColor() == colors.WHITE
            ? ~gameState.occupancies[colors.WHITE]
            : ~gameState.occupancies[colors.BLACK]);
      }

      // get slider moves
      if (moveBehavior instanceof SlidingMoveBehavior) {
        attacks |=
          moveBehavior.getAttacks(
            sourceSquare,
            gameState.occupancies[colors.BOTH],
            piece.getColor(),
            0,
          ) &
          (gameState.side == colors.WHITE
            ? ~gameState.occupancies[colors.WHITE]
            : ~gameState.occupancies[colors.BLACK]);
      }

      while (attacks > 0n) {
        targetSquare = getLSFBIndex(attacks);
        // quiet move
        if (
          !getBit(
            gameState.side == colors.WHITE
              ? gameState.occupancies[colors.BLACK]
              : gameState.occupancies[colors.WHITE],
            targetSquare,
          )
        ) {
          addMove(movesCopy, encodeMove(sourceSquare, targetSquare, piece.getId(), 0, 0, 0, 0, 0));
        } else {
          addMove(movesCopy, encodeMove(sourceSquare, targetSquare, piece.getId(), 0, 1, 0, 0, 0));
        }
        attacks &= ~(1n << BigInt(targetSquare));
      }
      bitboard &= ~(1n << BigInt(sourceSquare));
    }
  }
};
