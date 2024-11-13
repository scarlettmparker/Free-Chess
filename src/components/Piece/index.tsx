/**
 * 
 * @param param0 
 * @returns 
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