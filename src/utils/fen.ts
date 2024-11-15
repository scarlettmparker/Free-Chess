import { createSignal } from "solid-js";
import { BigIntSignalArray, bitboards, BOARD_SIZE, castle, charPieces, colors, occupancies, pieces, setBitboards, setCastle, setEnpassant, setOccupancies, setSide } from "~/consts/board";
import { getBit, updateBitboard } from "./board/bitboard";
import { setter, getter } from "./bigint";
import { notToRawPos } from "./board/squarehelper";

/**
 * Parses a FEN and sets the board's position.
 * @param fen FEN of a Chess board position.
 */
export const parseFEN = (fen: string) => {
    // reset board data
    setBitboards(bitboards().map(() => createSignal(0n)));
    setOccupancies(occupancies().map(() => createSignal(0n)));

    // reset player data
    setSide(0);
    setEnpassant(-1);
    setCastle(0n);

    // occupancies
    const setWhiteOccupancies = setter(occupancies, colors.WHITE);
    const setBlackOccupancies = setter(occupancies, colors.BLACK);
    const setBothOccupancies = setter(occupancies, colors.BOTH);

    let whiteOccupancies = getter(occupancies, colors.WHITE)();
    let blackOccupancies = getter(occupancies, colors.BLACK)();
    let bothOccupancies = getter(occupancies, colors.BOTH)();

    let fenIndex = 0;
    for (let rank = 0; rank < BOARD_SIZE; rank++) {
        for (let file = 0; file < BOARD_SIZE; file++) {
            const square = rank * 8 + file;
            const char = fen[fenIndex];

            // match pieces with fen string
            if ((char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z')) {
                let pieceIndex = charPieces[char];
                if (pieceIndex !== undefined) {
                    updateBitboard(getter(bitboards, pieceIndex)(), setter(bitboards, pieceIndex), square, true);
                }
                fenIndex++;
            }

            if (char >= '0' && char <= '9') {
                const offset = Number(char);
                let piece = -1;

                // loop over all piece bitboards
                for (let bbPiece = charPieces.P; bbPiece <= charPieces.k; bbPiece++) {
                    if (getBit(getter(bitboards, bbPiece)(), square)) {
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
    fen[fenIndex] == 'w' ? setSide(0) : setSide(1);
    fenIndex += 2;

    // parse castling rights
    while (fen[fenIndex] != ' ') {
        let currCastle = castle();
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
        setCastle(currCastle);
        fenIndex++;
    }

    fenIndex++;

    // parse en passant square
    if (fen[fenIndex] != '-') {
        const file = fen[fenIndex];
        const rank = fen[fenIndex + 1];
        const square = notToRawPos(file + rank);
        setEnpassant(square);
    } else {
        setEnpassant(-1);
    }

    // loop over white pieces bitboard
    for (let piece = charPieces.P; piece <= charPieces.K; piece++) {
        whiteOccupancies |= getter(bitboards, piece)();
    }

    setWhiteOccupancies(whiteOccupancies);

    // loop over black pieces bitboard
    for (let piece = charPieces.p; piece <= charPieces.k; piece++) {
        blackOccupancies |= getter(bitboards, piece)();
    }

    setBlackOccupancies(blackOccupancies);

    // include all occupancies in both
    bothOccupancies |= whiteOccupancies;
    bothOccupancies |= blackOccupancies
    setBothOccupancies(bothOccupancies);
}