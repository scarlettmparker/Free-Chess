import { JSX } from "solid-js";
import PieceType from "~/components/Piece/type";
import Square from "~/components/Square";
import initialPieces from "~/consts/board";

/**
 * 
 * @param BOARD_SIZE Size of the board.
 * @param WIDTH Width of each square.
 * @param HEIGHT Height of each square.
 * @returns List of square divs and list of pieces.
 */
const buildBoard = (BOARD_SIZE: number, WIDTH: number, HEIGHT: number) => {
    const divs: JSX.Element[] = [];
    const piecesList: PieceType[] = [];

    // begin iterating over board size
    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            const piece = initialPieces[`${i},${j}`];
            if (piece) {
                // get piece type from notation
                const color = piece == piece.toLowerCase() ? 0 : 1;
                piece && piecesList.push({ i, j, color, piece });
            }
            divs.push(
                <Square i={i} j={j} WIDTH={WIDTH} HEIGHT={HEIGHT} />
            );
        }
    }

    return { divs, piecesList };
}

export default buildBoard;