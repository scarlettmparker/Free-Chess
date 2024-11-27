import { BOARD_SIZE, colors, gameState, castlePieces } from "../consts/board";
import setBit, { getBit } from "./board/bitboard";
import { notToRawPos } from "./board/squarehelper";

/**
 * Parses a FEN and sets the board's position.
 * @param fen FEN of a Chess board position.
 */
export const parseFEN = (fen: string) => {
    // reset board data
    gameState.bitboards.map(() => 0n);
    gameState.occupancies.map(() => 0n);

    // reset player data
    gameState.side = -0;
    gameState.enpassant = -1;
    gameState.castle = 0n;

    const blackStartPiece = gameState.blackPieceIDs[0];
    const blackEndPiece = gameState.blackPieceIDs[gameState.blackPieceIDs.length - 1];

    const whiteStartPiece = gameState.whitePieceIDs[0];
    const whiteEndPiece = gameState.whitePieceIDs[gameState.whitePieceIDs.length - 1];

    // occupancies
    let fenIndex = 0;
    for (let rank = 0; rank < BOARD_SIZE; rank++) {
        for (let file = 0; file < BOARD_SIZE; file++) {
            const square = rank * 8 + file;
            const char = fen[fenIndex];

            // match pieces based on square brackets containing IDs
            if (char === '[') {
                let endBracketIndex = fen.indexOf(']', fenIndex);
                if (endBracketIndex === -1) {
                    throw new Error("Invalid FEN format: unmatched '['.");
                }

                const pieceID = parseInt(fen.slice(fenIndex + 1, endBracketIndex), 10);
                if (isNaN(pieceID)) {
                    throw new Error("Invalid FEN format: invalid piece ID.");
                }

                const piece = gameState.pieces.find(p => p.getID() === pieceID);
                if (!piece) {
                    throw new Error(`Piece with ID ${pieceID} not found.`);
                }

                // ensure the bitboard array is long enough
                if (pieceID >= gameState.bitboards.length) {
                    gameState.bitboards.length = pieceID + 1;
                    gameState.bitboards.fill(0n, gameState.bitboards.length);
                }

                gameState.bitboards[pieceID] = setBit(gameState.bitboards[pieceID], square, true);
                fenIndex = endBracketIndex + 1;
            } else if (char >= '0' && char <= '9') {
                const offset = Number(char);
                let piece = -1;

                // loop over all piece bitboards
                for (let bbPiece = 0; bbPiece < gameState.bitboards.length; bbPiece++) {
                    if (getBit(gameState.bitboards[bbPiece], square)) {
                        piece = bbPiece;
                    }
                }

                if (piece === -1) file--;
                file += offset;
                fenIndex++;
            } else if (char === '/') {
                fenIndex++;
            }
        }

        fenIndex++;
    }

    // parse side to move
    fen[fenIndex] == 'w' ? gameState.side = 0 : gameState.side = 1;
    fenIndex += 2;

    // parse castling rights
    while (fen[fenIndex] != ' ') {
        let currCastle = gameState.castle;
        switch (fen[fenIndex]) {
            case 'K':
                currCastle |= BigInt(castlePieces.wk); break;
            case 'Q':
                currCastle |= BigInt(castlePieces.wq); break;
            case 'k':
                currCastle |= BigInt(castlePieces.bk); break;
            case 'q':
                currCastle |= BigInt(castlePieces.bq); break;
            case '-':
                break;
        }
        gameState.castle = currCastle;
        fenIndex++;
    }

    fenIndex++;

    // parse en passant square
    if (fen[fenIndex] != '-') {
        const file = fen[fenIndex];
        const rank = fen[fenIndex + 1];
        const square = notToRawPos[file + rank];
        gameState.enpassant = square;
    } else {
        gameState.enpassant = -1;
    }

    // loop over white pieces bitboard
    let whiteOccupancies = gameState.occupancies[colors.WHITE];
    gameState.whitePieceIDs.forEach((piece) => {
        whiteOccupancies |= gameState.bitboards[piece];
    })
    gameState.occupancies[colors.WHITE] = whiteOccupancies;

    // loop over black pieces bitboard
    let blackOccupancies = gameState.occupancies[colors.BLACK];
    gameState.blackPieceIDs.forEach((piece) => {
        blackOccupancies |= gameState.bitboards[piece];
    })
    gameState.occupancies[colors.BLACK] = blackOccupancies;

    // include all occupancies in both
    let bothOccupancies = gameState.occupancies[colors.BOTH];
    bothOccupancies |= gameState.occupancies[colors.WHITE];
    bothOccupancies |= gameState.occupancies[colors.BLACK];
    gameState.occupancies[colors.BOTH] = bothOccupancies;
}

export default null;