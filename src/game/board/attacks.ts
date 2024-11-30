import { BOARD_SIZE, colors, gameState, getBitboard } from "../consts/board";
import { getCheckMove } from "../move/move";
import { Piece } from "../piece/piece";
import { PogoPiece } from "../piece/pogopiece";
import { getLSFBIndex, printBitboard } from "./bitboard";
import { rawPosToNot } from "./squarehelper";

/**
 * 
 * @param pos Square to check if attacked.
 * @param side Chess player (0. white, 1. black).
 * @param currentMove The current move of the board state.
 * @returns True (square is attacked), or false (square is not attacked).
 */
export const isSquareAttacked = (pos: number, side: number) => {
    if (pos == -1) return false
    const filteredPieces = gameState.pieces.filter(piece => {
        return piece.getColor() === (side === colors.WHITE ? colors.WHITE : colors.BLACK);
    });

    for (let piece of filteredPieces) {
        const pieceID = piece.getID();

        if (piece.getPawn()) {
            if (piece.getPawnPieceState()[piece.getColor() ^ 1][pos] & getBitboard(pieceID).bitboard) return true;
        }

        if (piece.getSlider()) {
            if (piece.getSlidingPieceAttacks(pos, gameState.occupancies[colors.BOTH], piece.straightConstraints, piece.diagonalConstraints) & getBitboard(pieceID).bitboard) return true;
        }

        if (piece.getLeaper()) {
            let bitboard = getBitboard(piece.getID()).bitboard;
            let checkMove = 0;

            while (bitboard > 0n) {
                let sourceSquare = getLSFBIndex(bitboard);
                checkMove = getCheckMove(piece, sourceSquare);

                if (checkMove && checkMove > 0) {
                    if (piece.getLeaperPieceState()[piece.getColor() ^ 1][checkMove][pos] & getBitboard(piece.getID()).bitboard) return true;
                }

                bitboard &= ~(1n << BigInt(sourceSquare));
            }

            if (checkMove == 0) {
                if (piece.getLeaperPieceState()[piece.getColor() ^ 1][checkMove][pos] & getBitboard(piece.getID()).bitboard) return true;
            }
        }
    }

    return false;
}

/**
 * Prints attacked squares for a given player.
 * @param side Chess player (0. white, 1. black).
 */
export const printAttackedSquares = (side: number, currentMove: number) => {
    let out = "";
    for (let rank = 0; rank < BOARD_SIZE; rank++) {
        for (let file = 0; file < BOARD_SIZE; file++) {
            const square = rank * 8 + file;
            if (!file)
                out += ` ${8 - rank}`;
            out += `  ${isSquareAttacked(square, side) ? 1 : 0}`
        }
        out += "\n";
    }
    out += "    a  b  c  d  e  f  g  h";
    console.log(out);
}

export default null;