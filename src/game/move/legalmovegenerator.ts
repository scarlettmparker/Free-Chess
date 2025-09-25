import {
  blackPromotions,
  castlePieces,
  colors,
  gameState,
  getBitboard,
  whitePromotions,
} from '../consts/board';
import { Piece } from '../piece/piece';
import { isSquareAttacked, printAttackedSquares } from '../board/attacks';
import { getBit, getLSFBIndex, printBitboard } from '../board/bitboard';
import { notToRawPos } from '../board/squarehelper';
import { addMove, getCheckMove } from './move';
import { encodeMove, MoveList } from './movedef';
import { PogoPiece } from '../piece/pogopiece';

export const generateMoves = (moves: MoveList, pieces: Piece[]) => {
  let l = pieces.length;
  let piece: Piece;

  for (let i = 0; i < l; i++) {
    piece = pieces[i];
    if (piece.getColor() != gameState.side) continue;
    generateMove(moves, piece);
  }
};

export const generateMove = (movesCopy: MoveList, piece: Piece) => {
  let targetSquare: number;
  let bitboard, attacks;

  bitboard = getBitboard(piece.getID()).bitboard;
  let sourceSquare = getLSFBIndex(bitboard);

  if (piece.getColor() == colors.WHITE && piece.getPawn()) {
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
                encodeMove(sourceSquare, targetSquare, piece.getID(), promotePiece, 0, 0, 0, 0),
              );
            });
          }
        } else {
          // one square ahead push
          addMove(movesCopy, encodeMove(sourceSquare, targetSquare, piece.getID(), 0, 0, 0, 0, 0));
          if (
            sourceSquare >= notToRawPos['a2'] &&
            sourceSquare <= notToRawPos['h2'] &&
            !getBit(gameState.occupancies[colors.BOTH], targetSquare - 8)
          ) {
            addMove(
              movesCopy,
              encodeMove(sourceSquare, targetSquare - 8, piece.getID(), 0, 0, 1, 0, 0),
            );
          }
        }
      }

      // initialize pawn attacks bitboard
      attacks =
        piece.getPawnPieceState()[gameState.side][sourceSquare] &
        gameState.occupancies[colors.BLACK];
      while (attacks > 0n) {
        targetSquare = getLSFBIndex(attacks);
        // pawn capture promotion
        if (sourceSquare >= notToRawPos['a7'] && sourceSquare <= notToRawPos['h7']) {
          if (piece.getPromote()) {
            whitePromotions.forEach((promotePiece) => {
              addMove(
                movesCopy,
                encodeMove(sourceSquare, targetSquare, piece.getID(), promotePiece, 1, 0, 0, 0),
              );
            });
          }
        } else {
          addMove(movesCopy, encodeMove(sourceSquare, targetSquare, piece.getID(), 0, 1, 0, 0, 0));
        }
        attacks &= ~(1n << BigInt(targetSquare));
      }

      if (gameState.enpassant != -1) {
        const enpassantAttacks =
          piece.getPawnPieceState()[gameState.side][sourceSquare] &
          (1n << BigInt(gameState.enpassant));
        if (enpassantAttacks) {
          let targetEnpassant = getLSFBIndex(enpassantAttacks);
          addMove(
            movesCopy,
            encodeMove(sourceSquare, targetEnpassant, piece.getID(), 0, 1, 0, 1, 0),
          );
        }
      }

      bitboard &= ~(1n << BigInt(sourceSquare));
    }
  }

  if (piece.getColor() == colors.WHITE && piece.getKing()) {
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
            encodeMove(notToRawPos['e1'], notToRawPos['g1'], piece.getID(), 0, 0, 0, 0, 1),
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
            encodeMove(notToRawPos['e1'], notToRawPos['c1'], piece.getID(), 0, 0, 0, 0, 1),
          );
        }
      }
    }
  }

  if (piece.getColor() == colors.BLACK && piece.getPawn()) {
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
                encodeMove(sourceSquare, targetSquare, piece.getID(), promotePiece, 0, 0, 0, 0),
              );
            });
          }
        } else {
          addMove(movesCopy, encodeMove(sourceSquare, targetSquare, piece.getID(), 0, 0, 0, 0, 0));
          if (
            sourceSquare >= notToRawPos['a7'] &&
            sourceSquare <= notToRawPos['h7'] &&
            !getBit(gameState.occupancies[colors.BOTH], targetSquare + 8)
          ) {
            addMove(
              movesCopy,
              encodeMove(sourceSquare, targetSquare + 8, piece.getID(), 0, 0, 1, 0, 0),
            );
          }
        }
      }

      // initialize pawn attacks bitboard
      attacks =
        piece.getPawnPieceState()[gameState.side][sourceSquare] &
        gameState.occupancies[colors.WHITE];
      while (attacks > 0n) {
        targetSquare = getLSFBIndex(attacks);
        // pawn capture promotion
        if (sourceSquare >= notToRawPos['a2'] && sourceSquare <= notToRawPos['h2']) {
          if (piece.getPromote()) {
            blackPromotions.forEach((promotePiece) => {
              addMove(
                movesCopy,
                encodeMove(sourceSquare, targetSquare, piece.getID(), promotePiece, 1, 0, 0, 0),
              );
            });
          }
        } else {
          addMove(movesCopy, encodeMove(sourceSquare, targetSquare, piece.getID(), 0, 1, 0, 0, 0));
        }
        attacks &= ~(1n << BigInt(targetSquare));
      }

      if (gameState.enpassant != -1) {
        const enpassantAttacks =
          piece.getPawnPieceState()[gameState.side][sourceSquare] &
          (1n << BigInt(gameState.enpassant));
        if (enpassantAttacks) {
          let targetEnpassant = getLSFBIndex(enpassantAttacks);
          addMove(
            movesCopy,
            encodeMove(sourceSquare, targetEnpassant, piece.getID(), 0, 1, 0, 1, 0),
          );
        }
      }
      bitboard &= ~(1n << BigInt(sourceSquare));
    }
  }

  if (piece.getColor() == colors.BLACK && piece.getKing()) {
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
            encodeMove(notToRawPos['e8'], notToRawPos['g8'], piece.getID(), 0, 0, 0, 0, 1),
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
            encodeMove(notToRawPos['e8'], notToRawPos['c8'], piece.getID(), 0, 0, 0, 0, 1),
          );
        }
      }
    }
  }

  if (piece.getLeaper() || piece.getSlider()) {
    let checkMove = 0;
    let attacks = 0n;

    while (bitboard > 0n) {
      sourceSquare = getLSFBIndex(bitboard);
      checkMove = getCheckMove(piece, sourceSquare);

      // get leaper moves
      if (piece.getLeaper()) {
        attacks |=
          piece.getLeaperPieceState()[piece.getColor()][checkMove][sourceSquare] &
          (piece.getColor() == colors.WHITE
            ? ~gameState.occupancies[colors.WHITE]
            : ~gameState.occupancies[colors.BLACK]);
      }

      // get slider moves
      if (piece.getSlider()) {
        attacks |=
          piece.getSlidingPieceAttacks(
            sourceSquare,
            gameState.occupancies[colors.BOTH],
            piece.straightConstraints,
            piece.diagonalConstraints,
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
          addMove(movesCopy, encodeMove(sourceSquare, targetSquare, piece.getID(), 0, 0, 0, 0, 0));
        } else {
          addMove(movesCopy, encodeMove(sourceSquare, targetSquare, piece.getID(), 0, 1, 0, 0, 0));
        }
        attacks &= ~(1n << BigInt(targetSquare));
      }
      bitboard &= ~(1n << BigInt(sourceSquare));
    }
  }
};
