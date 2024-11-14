import notToSquare from "../squarehelper";

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
export function getBit(bitboard: bigint, pos: string) {
    const result = notToSquare(pos);

    if (typeof result === "string") {
        return bitboard;
    }

    const [column, row] = result;
    const index = row * 8 + column;

    // shift bit board by index pos & mask with 1
    const bit = (bitboard >> BigInt(index)) & 1n;
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

export default setBit;