import { BOARD_SIZE, colors, gameState } from "../../consts/board";

/**
 * 
 * @param pos Square to check if attacked.
 * @param side Chess player (0. white, 1. black).
 * @param currentMove The current move of the board state.
 * @returns True (square is attacked), or false (square is not attacked).
 */
export const isSquareAttacked = (pos: number, side: number, currentMove: number) => {
    if (pos == -1) return false;

    const filteredPieces = gameState.pieces.filter(piece => {
        return piece.getColor() === (side === colors.WHITE ? colors.WHITE : colors.BLACK);
    });

    for (let piece of filteredPieces) {
        const pieceID = piece.getID();

        if (piece.getPawn()) {
            if (piece.getPawnPieceState()[piece.getColor() ^ 1][pos] & gameState.bitboards[pieceID]) return true;
        }

        if (piece.getSlider()) {
            if (piece.getSlidingPieceAttacks(pos, gameState.occupancies[colors.BOTH]) & gameState.bitboards[pieceID]) return true;
        }

        if (piece.getLeaper()) {
            let checkMove = (currentMove % piece.getLeaperPieceState().length) || 0;
            if (piece.getLeaperPieceState()[checkMove][pos] & gameState.bitboards[pieceID]) return true;
        }
    }

    return false;
}

/**
 * Prints attacked squares for a given player.
 * @param side Chess player (0. white, 1. black).
 */
export const printAttackedSquares = (side: number, currentMove: number) => {
    let out = "";
    for (let rank = 0; rank < BOARD_SIZE; rank++) {
        for (let file = 0; file < BOARD_SIZE; file++) {
            const square = rank * 8 + file;
            if (!file)
                out += ` ${8 - rank}`;
            out += `  ${isSquareAttacked(square, side, currentMove) ? 1 : 0}`
        }
        out += "\n";
    }
    out += "    a  b  c  d  e  f  g  h";
    console.log(out);
}

export default null;