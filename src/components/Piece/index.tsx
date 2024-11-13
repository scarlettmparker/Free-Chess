/**
 * 
 * @param i Y position of the piece.
 * @param j X position of the piece.
 * @param WIDTH Width of the Chess board.
 * @param HEIGHT Height of the Chess board.
 * @param piece Piece name (for temporary printing no sprites right now).
 * @param onMouseDown onMouseDown event for dragging pieces.
 * @returns JSX element for the piece.
 */
const Piece = ({ i, j, WIDTH, HEIGHT, piece, onMouseDown }: {
    i: number, j: number, WIDTH: number, HEIGHT: number, piece: string; onMouseDown: () => void
}) => {
    const posX = j;
    const posY = i;

    // display position on the board
    const displayX = posX * WIDTH;
    const displayY = posY * HEIGHT;

    let color = (i + j) % 2 == 0 ? "text-slate-900" : "text-slate-100";

    return (
        <div class={`absolute ${color} flex items-center justify-center select-none`} style={{
            width: `${WIDTH}px`, height: `${HEIGHT}px`,
            left: `${displayX}px`,
            top: `${displayY}px`,
        }} onmousedown={onMouseDown}>{piece && piece}</div>
    )
}

export default Piece;