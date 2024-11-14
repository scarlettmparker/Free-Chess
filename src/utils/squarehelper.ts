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
export function rawPosToNot(square: number) {
    const column = String.fromCharCode('a'.charCodeAt(0) + (square % 8));
    const row = 8 - Math.floor(square / 8);
    return column + row;
}

/**
 * 
 * @param position Position (e.g. a1) on a Chess board.
 * @returns Square number (0 to 63).
 */
export function notToRawPos(position: string): number {
    const column = position[0];
    const row = parseInt(position[1], 10);

    const columnIndex = column.charCodeAt(0) - 'a'.charCodeAt(0);
    const rowIndex = 8 - row;

    return rowIndex * 8 + columnIndex;
}

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

export default notToSquare;