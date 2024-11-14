import { Accessor } from "solid-js";
import { WIDTH, BOARD_SIZE, HEIGHT } from "~/consts/board";
import { Position } from "~/routes/index";
import PieceType from "~/components/Piece/type";

// mouse down handler
export const handleMouseDown = (i: number, j: number, piece: string, pieces: Accessor<PieceType[]>, setDraggingPiece: (value: PieceType) => void, setDragPos: (value: Position) => void) => {
    const matchedPiece = pieces().find(p => p.i == i && p.j == j && p.piece == piece);
    if (matchedPiece) {
        setDraggingPiece(matchedPiece);
        setDragPos({ x: matchedPiece.i, y: matchedPiece.j });
    }
}

// mouse move handler
export const handleMouseMove = (e: MouseEvent, draggingPiece: Accessor<PieceType | null>, setDragPos: (value: Position) => void) => {
    if (draggingPiece()) {
        setDragPos({ x: e.clientX, y: e.clientY });
    }
}

// mouse up handler
export const handleMouseUp = (dragPos: Accessor<Position | null>, setDragPos: (value: Position | null) => void, draggingPiece: Accessor<PieceType | null>,
    setDraggingPiece: (value: PieceType | null) => void, pieces: Accessor<PieceType[]>, setPieces: (value: PieceType[]) => void) => {

    if (!draggingPiece()) {
        return;
    }
    
    const newX = Math.floor((dragPos()!.x - (WIDTH / 2) + 1) / WIDTH) - BOARD_SIZE + 2;
    const newY = Math.floor((dragPos()!.y + 1) / HEIGHT) - 2; // pretty sure i had this + 1 in other code idk why it's like this

    // ensure new position is within bounds
    if (newX >= 0 && newX < BOARD_SIZE && newY >= 0 && newY < BOARD_SIZE) {
        const updatedPieces = pieces().map(piece => {
            if (piece === draggingPiece()) {
                return { ...piece, i: newY, j: newX };
            }
            return piece;
        });
        setPieces(updatedPieces);
    }

    setDraggingPiece(null);
    setDragPos(null);
}

export default null;