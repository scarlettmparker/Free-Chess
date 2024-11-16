import { BOARD_SIZE, charPieces, colors, gameState } from "~/consts/board";
import { getpState } from "~/pieces/pawn";
import { getter } from "../bigint";
import { getkState } from "~/pieces/knight";
import { getkiState } from "~/pieces/king";
import { getBishopAttacks } from "~/pieces/bishop";
import { getRookAttacks } from "~/pieces/rook";
import { getQueenAttacks } from "~/pieces/queen";

/**
 * 
 * @param pos Square to check if attacked.
 * @param side Chess player (0. white, 1. black).
 * @returns True (square is attacked), or false (square is not attacked).
 */
export const isSquareAttacked = (pos: number, side: number) => {
    // pawns
    if ((side == colors.WHITE) && getpState(colors.BLACK, pos)
        & gameState.bitboards[charPieces.P]) return true;
    if ((side == colors.BLACK) && getpState(colors.WHITE, pos)
        & gameState.bitboards[charPieces.p]) return true;

    // knights
    if (getkState(pos) & ((side == colors.WHITE) ? gameState.bitboards[charPieces.N]
        : gameState.bitboards[charPieces.n])) return true;

    // bishops
    if (getBishopAttacks(pos, gameState.occupancies[colors.BOTH])
        & ((side == colors.WHITE) ? gameState.bitboards[charPieces.B] : gameState.bitboards[charPieces.b])) return true;

    // rooks
    if (getRookAttacks(pos, gameState.occupancies[colors.BOTH])
        & ((side == colors.WHITE) ? gameState.bitboards[charPieces.R] : gameState.bitboards[charPieces.r])) return true;

    // queens
    if (getQueenAttacks(pos, gameState.occupancies[colors.BOTH])
        & ((side == colors.WHITE) ? gameState.bitboards[charPieces.Q] : gameState.bitboards[charPieces.q])) return true;

    // kings
    if (getkiState(pos) & ((side == colors.WHITE) ? gameState.bitboards[charPieces.K]
        : gameState.bitboards[charPieces.k])) return true;

    return false;
}

/**
 * Prints attacked squares for a given player.
 * @param side Chess player (0. white, 1. black).
 */
export const printAttackedSquares = (side: number) => {
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