import notToSquare from "./squarehelper";

/**
 * 
 * @param bitBoard Bit board to modify.
 * @param pos Position (e.g. a1) o a Chess board.
 * @param push True: sets to 1, False: sets to 0.
 * @returns 
 */
function setBit(bitBoard: bigint, pos: string, push: boolean) {
    const result = notToSquare(pos);

    if (typeof result === "string") {
        return bitBoard;  // Return the bitBoard unchanged if invalid position
    }

    const [column, row] = result;
    const index = row * 8 + column;
    let updatedBitBoard;

    if (push) {
        updatedBitBoard = bitBoard | (1n << BigInt(index));
    } else {
        updatedBitBoard = bitBoard & ~(1n << BigInt(index));
    }

    // Return the updated bitBoard, rather than calling setBitBoard here
    return updatedBitBoard;
}

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