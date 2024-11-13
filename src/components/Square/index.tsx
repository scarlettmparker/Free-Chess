/**
 * 
 * @param i index for the square position.
 * @param j index for the square position.
 * @param WIDTH Width of the square.
 * @param HEIGHT Height of the square.
 * @returns JSX for a square component
 */
const Square = ({ i, j, WIDTH, HEIGHT }: { i: number, j: number, WIDTH: number, HEIGHT: number }) => {
    let color = (i + j) % 2 == 0 ? "bg-slate-200" : "bg-slate-800";

    return (
        <div id={i + "" + j} class={`relative ${color} before:content-['']`} style={{
            width: `${WIDTH}px`,
            height: `${HEIGHT}px`
        }} />
    )
}

export default Square;