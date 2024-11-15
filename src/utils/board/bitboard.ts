import { Accessor } from "solid-js";
import { rawPosToNot } from "../squarehelper";
import { BOARD_SIZE, charPieces, unicodePieces, pieces, BitboardSignal } from "~/consts/board";
import { getter } from "../bigint";

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
 * Helper function to set the state of a bitboard.
 * @param bitboard Accessor of bitboard to update.
 * @param setBitboard Bitboard setter.
 * @param pos Position (e.g. a1) on a Chess board.
 * @param push True: sets to 1, False: sets to 0.
 */
export function updateBitboard(bitboard: bigint, setBitboard: (bitboard: bigint) => void, pos: number, push: boolean) {
    let updatedBitboard = setBit(bitboard, pos, push);
    setBitboard(updatedBitboard);
};

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

/**
 * 
 * @param bitboard Bitboard to count.
 * @returns Number of bits available on the bitboard.
 */
export function countBits(bitboard: bigint) {
    let count = 0;

    while (bitboard > 0n) {
        count++;
        bitboard &= bitboard - 1n;
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
        return Math.floor(Math.log2(Number(bitboard & -bitboard)));
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
export const printBoard = (bitboards: Accessor<BitboardSignal[]>, side: number, enpassant: number, castle: bigint) => {
    let board = "";
    for (let rank = 0; rank < BOARD_SIZE; rank++) {
        board += `${8 - rank}  `;

        for (let file = 0; file < BOARD_SIZE; file++) {
            const square = rank * BOARD_SIZE + file;
            let piece = -1;

            // loop over all piece bitboards
            for (let bbPiece = charPieces.P; bbPiece <= charPieces.k; bbPiece++) {
                if (getBit(getter(bitboards, bbPiece)(), square)) {
                    piece = bbPiece;
                }
            }

            board += `${(piece == -1) ? '. ' : unicodePieces[piece]} `;
        }
        board += "\n";
    }

    board += "   a  b  c  d  e  f  g  h\n\n";
    board += `   Side to move: ${side == 0 ? "white" : "black"}\n`;
    board += `   En passant: ${enpassant >= 0 ? rawPosToNot(enpassant) : "none"}\n`;
    board += `   Castle: ${getCastling(castle)}`;
    console.log(board);
}

/**
 * 
 * @param castle Current castling rights for all players.
 * @returns Formatted castling rights (e.g. KQkq).
 */
function getCastling(castle: bigint) {
    const rights = [];

    if (castle & BigInt(pieces.wk)) rights.push('K');
    if (castle & BigInt(pieces.wq)) rights.push('Q');
    if (castle & BigInt(pieces.bk)) rights.push('k');
    if (castle & BigInt(pieces.bq)) rights.push('q');

    return rights.join('');
}

export default setBit;