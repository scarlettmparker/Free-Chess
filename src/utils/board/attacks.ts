import { BOARD_SIZE, charPieces, colors } from "~/consts/board";
import { getpState } from "~/pieces/pawn";
import { getter } from "../bigint";
import { bitboards, occupancies } from "../fen";
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
        & getter(bitboards, charPieces.P)()) return true;
    if ((side == colors.BLACK) && getpState(colors.WHITE, pos)
        & getter(bitboards, charPieces.p)()) return true;

    // knights
    if (getkState(pos) & ((side == colors.WHITE) ? getter(bitboards, charPieces.N)()
        : getter(bitboards, charPieces.n)())) return true;

    // bishops
    if (getBishopAttacks(pos, getter(occupancies, colors.BOTH)())
        & ((side == colors.WHITE) ? getter(bitboards, charPieces.B)() : getter(bitboards, charPieces.b)())) return true;

    // rooks
    if (getRookAttacks(pos, getter(occupancies, colors.BOTH)())
        & ((side == colors.WHITE) ? getter(bitboards, charPieces.R)() : getter(bitboards, charPieces.r)())) return true;

    // queens
    if (getQueenAttacks(pos, getter(occupancies, colors.BOTH)())
        & ((side == colors.WHITE) ? getter(bitboards, charPieces.Q)() : getter(bitboards, charPieces.q)())) return true;

    // kings
    if (getkiState(pos) & ((side == colors.WHITE) ? getter(bitboards, charPieces.K)()
        : getter(bitboards, charPieces.k)())) return true;

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