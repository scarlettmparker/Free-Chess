import { gameState } from "../../consts/board";

/**
 * Copies the current board state.
 */
export function copyBoard() {
    const bitboardsCopy = Array.from({ length: 12 }, (_, i) => gameState.bitboards[i]);
    const occupanciesCopy = Array.from({ length: 3 }, (_, i) => gameState.occupancies[i]);
    const sideCopy = gameState.side;
    const enpassantCopy = gameState.enpassant;
    const castleCopy = gameState.castle;

    return {
        bitboardsCopy,
        occupanciesCopy,
        sideCopy,
        enpassantCopy,
        castleCopy
    };
}

/**
 * Restores the board state from a previous copy.
 * @param {Object} copies - The copied board states returned by copyBoard.
 */
export function takeBack(copies: { bitboardsCopy: bigint[]; occupanciesCopy: bigint[]; sideCopy: number; enpassantCopy: number; castleCopy: bigint; }) {
    const { bitboardsCopy, occupanciesCopy, sideCopy, enpassantCopy, castleCopy } = copies;

    // restore bitboards
    gameState.bitboards = bitboardsCopy;
    gameState.occupancies = occupanciesCopy;
    gameState.side = sideCopy;
    gameState.enpassant = enpassantCopy;
    gameState.castle = castleCopy;
}

export default null;