import {  BOARD_SIZE, charPieces, colors, gameState, pieces} from "../consts/board";
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

    // occupancies
    let fenIndex = 0;
    for (let rank = 0; rank < BOARD_SIZE; rank++) {
        for (let file = 0; file < BOARD_SIZE; file++) {
            const square = rank * 8 + file;
            const char = fen[fenIndex];

            // match pieces with fen string
            if ((char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z')) {
                let pieceIndex = charPieces[char];
                if (pieceIndex !== undefined) {
                    gameState.bitboards[pieceIndex] = setBit(gameState.bitboards[pieceIndex], square, true);
                }
                fenIndex++;
            }

            if (char >= '0' && char <= '9') {
                const offset = Number(char);
                let piece = -1;

                // loop over all piece bitboards
                for (let bbPiece = charPieces.P; bbPiece <= charPieces.k; bbPiece++) {
                    if (getBit(gameState.bitboards[bbPiece], square)) {
                        piece = bbPiece;
                    }
                }

                if (piece == -1) file--;
                file += offset;
                fenIndex++;
            }

            if (char == '/') {
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
                currCastle |= BigInt(pieces.wk); break;
            case 'Q':
                currCastle |= BigInt(pieces.wq); break;
            case 'k':
                currCastle |= BigInt(pieces.bk); break;
            case 'q':
                currCastle |= BigInt(pieces.bq); break;
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
    for (let piece = charPieces.P; piece <= charPieces.K; piece++) {
        whiteOccupancies |= gameState.bitboards[piece];
    }
    gameState.occupancies[colors.WHITE] = whiteOccupancies;

    // loop over black pieces bitboard
    let blackOccupancies = gameState.occupancies[colors.BLACK];
    for (let piece = charPieces.P; piece <= charPieces.K; piece++) {
        blackOccupancies |= gameState.bitboards[piece];
    }
    gameState.occupancies[colors.BLACK] = blackOccupancies;

    // include all occupancies in both
    let bothOccupancies = gameState.occupancies[colors.BOTH];
    bothOccupancies |= gameState.occupancies[colors.WHITE];
    bothOccupancies |= gameState.occupancies[colors.BLACK];
    gameState.occupancies[colors.BOTH] = bothOccupancies;
}

export default null;