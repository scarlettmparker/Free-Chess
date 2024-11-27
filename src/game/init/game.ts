import { gameState, colors } from "../consts/board";
import { Piece } from "../piece/piece";

/**
 * Helper function to reset the game state, sets everything in
 * the global game state variables to their defaults.
 */
export function resetGameState() {
    gameState.pieces = [];
    gameState.bitboards = [];
    gameState.occupancies = Array.from({ length: 3 }, () => 0n);
    gameState.globalMove = 0;
    gameState.side = 0;
    gameState.enpassant = -1;
    gameState.castle = 0n;
    gameState.nodes = 0;
    gameState.captures = 0;
    gameState.promotions = 0;
    gameState.castles = 0;
    gameState.checks = 0;
}

/**
 * Initialize the game state. Goes through all pieces added on
 * game start and creates a bitboard of array of length no. pieces.
 */
export function initGameState() {
    gameState.whitePieceIDs = gameState.pieces
        .filter((piece: Piece) => piece.getColor() === colors.WHITE)
        .map((piece: Piece) => piece.getID());

    gameState.blackPieceIDs = gameState.pieces
        .filter((piece: Piece) => piece.getColor() === colors.BLACK)
        .map((piece: Piece) => piece.getID())

    gameState.bitboards = Array.from({ length: (gameState.whitePieceIDs.length + gameState.blackPieceIDs.length) }, (_, index) => {
        const pieceID = gameState.pieces[index].getID();
        return { pieceID, bitboard: 0n };
    });
}

/**
 * Initialize the game. Loops through the pieces and initializes
 * their attacks, copying the sliding pieces from white to black.
 */
export function initGame() {
    gameState.pieces.map((piece) => {
        if (piece.getSlider()) {
            if (piece.getColor() == colors.WHITE) {
                piece.initSlidingAttacks();
            }
        } else if (piece.getLeaper()) {
            piece.initLeaperAttacks();
        } else if (piece.getPawn()) {
            piece.initPawnAttacks();
        }
    });

    // since sliding pieces for black are the same as white, attacks are repeated
    for (let piece of gameState.pieces) {
        if (piece.getColor() == colors.WHITE) continue;
        if (piece.getSlider()) {
            const whiteEquivalent = getPieceByID(piece.getID() - 1);

            // copy white piece's sliding attacks to black piece
            if (whiteEquivalent) {
                piece.setSlidingStraightPieceState(whiteEquivalent.getSlidingStraightPieceState());
                piece.setStraightPieceMask(whiteEquivalent.getStraightPieceMask());
                piece.setSlidingDiagonalPieceState(whiteEquivalent.getSlidingDiagonalPieceState());
                piece.setDiagonalPieceMask(whiteEquivalent.getDiagonalPieceMask());
            }
        }
    }
}

/**
 * Helper function to get a Piece object by its ID.
 * @param pieceID ID of the Piece object to search for.
 * @returns Piece object from the game state.
 */
const getPieceByID = (pieceID: number) => {
    return gameState.pieces.find(piece => piece.getID() === pieceID);
}