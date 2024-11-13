import notToSquare from "./squarehelper";

/**
 * 
 * @param bitBoard Bit board to modify.
 * @param pos Position (e.g. a1) on a Chess board.
 * @param push True: sets to 1, False: sets to 0.
 * @returns 
 */
function setBit(bitBoard: bigint, pos: string, push: boolean) {
    const result = notToSquare(pos);

    // return unchanged bitboard if invalid position
    if (typeof result === "string") {
        return bitBoard;
    }

    const [column, row] = result;
    const index = row * 8 + column;
    let updatedBitBoard;

    if (push) {
        updatedBitBoard = bitBoard | (1n << BigInt(index));
    } else {
        updatedBitBoard = bitBoard & ~(1n << BigInt(index));
    }

    return updatedBitBoard;
}

/**
 * 
 * @param bitBoard Bit board to get value from.
 * @param pos Position (e.g. a1) on a Chess board.
 * @returns Bit at position in bit board.
 */
export function getBit(bitBoard: bigint, pos: string) {
    const result = notToSquare(pos);

    if (typeof result === "string") {
        return bitBoard;
    }

    const [column, row] = result;
    const index = row * 8 + column;

    // shift bit board by index pos & mask with 1
    const bit = (bitBoard >> BigInt(index)) & BigInt(1);
    return Number(bit);
}

/**
 * 
 * @param bitBoard Bit board to print.
 * @returns 8 arrays showing the bit board values.
 */
export function printBitBoard(bitBoard: bigint) {
    let grid: string[] = [];

    for (let i = 7; i >= 0; i--) {
        let row = '';
        for (let j = 0; j < 8; j++) {
            const index = i * 8 + j;
            if ((bitBoard & (BigInt(1) << BigInt(index))) !== BigInt(0)) {
                row += '1 ';
            } else {
                row += '0 ';
            }
        }
        grid.push(row.trim());
    }

    return grid;
}

export default setBit;