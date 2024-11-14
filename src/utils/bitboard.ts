import notToSquare from "./squarehelper";

/**
 * 
 * @param bitBoard Bitboard to modify.
 * @param pos Position (e.g. a1) on a Chess board.
 * @param push True: sets to 1, False: sets to 0.
 * @returns Updated bitboard.
 */
function setBit(bitboard: bigint, pos: string, push: boolean) {
    const result = notToSquare(pos);

    // return unchanged bitboard if invalid position
    if (typeof result === "string") {
        return bitboard;
    }

    const [column, row] = result;
    const index = row * 8 + column;

    if (push) {
        return bitboard | (1n << BigInt(index));
    } else {
        return bitboard & ~(1n << BigInt(index));
    }
}

/**
 * 
 * @param bitboard Bitboard to modify
 * @param pos Pos number (index on the bitboard).
 * @param push True: sets to 1, False: sets to 0.
 * @returns Updated bitboard.
 */
export function setBitRaw(bitboard: bigint, pos: number, push: boolean) {
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
export function updateBitboard(bitboard: bigint, setBitboard: (bitboard: bigint) => void, pos: string, push: boolean) {
    let updatedBitboard = setBit(bitboard, pos, push);
    setBitboard(updatedBitboard);
};

/**
 * 
 * @param bitboard Bit board to get value from.
 * @param pos Position (e.g. a1) on a Chess board.
 * @returns Bit at position in bitboard.
 */
export function getBit(bitboard: bigint, pos: string) {
    const result = notToSquare(pos);

    if (typeof result === "string") {
        return bitboard;
    }

    const [column, row] = result;
    const index = row * 8 + column;

    // shift bit board by index pos & mask with 1
    const bit = (bitboard >> BigInt(index)) & BigInt(1);
    return Number(bit);
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
            if ((bitboard & (BigInt(1) << BigInt(index))) !== BigInt(0)) {
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

export default setBit;