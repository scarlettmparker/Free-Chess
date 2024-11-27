import { notHGFile, notHFile, notAFile, notABFile } from "../../consts/board";

/**
 * Helper function to check which colour a square should be painted.
 * @param square Square to check.
 * @returns 1 (dark), 0 (not dark).
 */
export function isDarkSquare(square: number) {
    const row = Math.floor(square / 8);
    const col = square % 8;
    return (row + col) % 2 !== 0;
}

/**
 * 
 * @param i index for the square position.
 * @param j index for the square position.
 * @returns Square position in Chess notation.
 */
export function squareToNot(i: number, j: number) {
    const letter = String.fromCharCode(104 - i);
    return (letter + "" + (j + 1));
}

/**
 * 
 * @param square Square on a Chess board.
 * @returns Position (e.g. a1) on a Chess board.
 */
export const rawPosToNot = Array.from({ length: 64 }, (_, square) => {
    const column = square % 8;  // Column (0-7)
    const row = 8 - Math.floor(square / 8);  // Row (1-8)
    return String.fromCharCode(column + 97) + row;  // Algebraic notation
});

/**
 * Creates a table to convert a Chess square to its index.
 */
export const notToRawPos: { [key: string]: number } = (() => {
    const result: { [key: string]: number } = {};
    for (let row = 1; row <= 8; row++) {
        for (let col = 0; col < 8; col++) {
            const position = String.fromCharCode('a'.charCodeAt(0) + col) + row;
            const index = (8 - row) * 8 + col;
            result[position] = index;
        }
    }
    return result;
})();

/**
 * 
 * @param pos Position (e.g. a1) on a Chess board.
 * @returns Column and row values for Chess board position.
 */
function notToSquare(pos: string) {
    if (pos.length != 2) { return "Invalid input!" }

    const column = pos[0].toUpperCase().charCodeAt(0) - 'A'.charCodeAt(0) ;
    const row = Number(pos[1]);

    if (column < 0 || column > 7 || row < 0 || row > 7) {
        return "Invalid position!";
    }

    return [column, row];
}

export const getFileConstraint = (fileOffset: number): bigint => {
    switch (fileOffset) {
        case -2: 
            return notHGFile;
        case -1:
            return notHFile;
        case 1:
            return notAFile;
        case 2:
            return notABFile;
        default: return ~0n;
    }
};

export default notToSquare;