import { charPieces, colors, gameState, moveType, unicodePieces } from "../../consts/board";
import { notToRawPos, rawPosToNot } from "../board/squarehelper"
import { getMoveCapture, getMoveCastle, getMoveDouble, getMoveEnpassant, getMovePiece, getMovePromoted, getMoveSource, getMoveTarget, MoveList, promotedPieces } from "./movedef"
import { copyBoard, takeBack } from "../board/copy";
import setBit, { getBit, getLSFBIndex, printBitboard } from "../board/bitboard";
import { castlingRights } from "../../consts/bits";
import { isSquareAttacked } from "../board/attacks";

/**
 * Adds a move to the move list.
 * @param moves Move list to add move to.
 * @param move Move to add to move list.
 */
export const addMove = (moves: MoveList, move: number) => {
    moves.moves[moves.count] = move;
    moves.count++;
}

/**
 * Makes a move by recursively calling the move function and copying/restoring the board state.
 * @param move Encoded move.
 * @param moveFlag Move type.
 * @returns 1 (legal move), 0 (illegal move).
 */
export const makeMove = (move: number, moveFlag: number, currentMove: number) => {
    if (moveFlag == moveType.ALL_MOVES) {
        const copies = copyBoard();

        let tempBitboards = gameState.bitboards;

        // parse the move
        const sourceSquare = getMoveSource(move);
        const targetSquare = getMoveTarget(move);
        const piece = getMovePiece(move);
        const promoted = getMovePromoted(move);
        const capture = getMoveCapture(move);
        const double = getMoveDouble(move);
        const enpassantFlag = getMoveEnpassant(move);
        const castling = getMoveCastle(move);

        // move the piece
        tempBitboards[piece] = setBit(tempBitboards[piece], sourceSquare, false);
        tempBitboards[piece] = setBit(tempBitboards[piece], targetSquare, true);

        const opponentPieceIDs = gameState.side == colors.WHITE ? gameState.blackPieceIDs : gameState.whitePieceIDs;

        // captures
        if (capture) {
            // loop over bitboard of opposite side
            for (let bbPiece of opponentPieceIDs) {
                if (getBit(tempBitboards[bbPiece], targetSquare)) { // piece on target square
                    tempBitboards[bbPiece] = setBit(tempBitboards[bbPiece], targetSquare, false);
                    break;
                }
            }
        }

        // promotions
        if (promoted) {
            tempBitboards[piece] = setBit(tempBitboards[piece], targetSquare, false);
            tempBitboards[promoted] = setBit(tempBitboards[promoted], targetSquare, true);
        }

        // en passant
        if (enpassantFlag) {
            (gameState.side == colors.WHITE) ? tempBitboards[charPieces.p] = setBit(tempBitboards[charPieces.p], targetSquare + 8, false)
                : tempBitboards[charPieces.P] = setBit(tempBitboards[charPieces.P], targetSquare - 8, false)
        }

        gameState.enpassant = -1;

        // double pawn push
        if (double) {
            (gameState.side == colors.WHITE) ? gameState.enpassant = targetSquare + 8 : gameState.enpassant = targetSquare - 8;
        }

        // castling moves
        if (castling) {
            switch (targetSquare) {
                case (notToRawPos["g1"]):
                    tempBitboards[charPieces.R] = setBit(tempBitboards[charPieces.R], notToRawPos["h1"], false);
                    tempBitboards[charPieces.R] = setBit(tempBitboards[charPieces.R], notToRawPos["f1"], true);
                    break;
                case (notToRawPos["c1"]):
                    tempBitboards[charPieces.R] = setBit(tempBitboards[charPieces.R], notToRawPos["a1"], false);
                    tempBitboards[charPieces.R] = setBit(tempBitboards[charPieces.R], notToRawPos["d1"], true);
                    break;
                case (notToRawPos["g8"]):
                    tempBitboards[charPieces.r] = setBit(tempBitboards[charPieces.r], notToRawPos["h8"], false);
                    tempBitboards[charPieces.r] = setBit(tempBitboards[charPieces.r], notToRawPos["f8"], true);
                    break;
                case (notToRawPos["c8"]):
                    tempBitboards[charPieces.r] = setBit(tempBitboards[charPieces.r], notToRawPos["a8"], false);
                    tempBitboards[charPieces.r] = setBit(tempBitboards[charPieces.r], notToRawPos["d8"], true);
                    break;
            }
        }


        // update castling rights
        let newCastle = Number(gameState.castle);
        newCastle &= (castlingRights[sourceSquare]);
        newCastle &= (castlingRights[targetSquare]);
        gameState.castle = BigInt(newCastle);

        // update occupancies
        for (let i = 0; i < 3; i++) {
            gameState.occupancies[i] = 0n;
        }

        // update white pieces occupancies
        let whiteOccupancy = gameState.occupancies[colors.WHITE];
        for (let bbPiece of gameState.whitePieceIDs) {
            whiteOccupancy |= tempBitboards[bbPiece];
        }
        gameState.occupancies[colors.WHITE] = whiteOccupancy;

        // update black pieces occupancies
        let blackOccupancy = gameState.occupancies[colors.BLACK];
        for (let bbPiece of gameState.blackPieceIDs) {
            blackOccupancy |= tempBitboards[bbPiece];
        }
        gameState.occupancies[colors.BLACK] = blackOccupancy;

        // update both sides occupancies
        let bothOccupancy = gameState.occupancies[colors.BOTH];
        bothOccupancy |= whiteOccupancy;
        bothOccupancy |= blackOccupancy;
        gameState.occupancies[colors.BOTH] = bothOccupancy;

        // change side
        gameState.side ^= 1;
        gameState.bitboards = tempBitboards;

        // check if king exposed to check
        if (isSquareAttacked((gameState.side == colors.WHITE) ? getLSFBIndex(tempBitboards[charPieces.k]) : getLSFBIndex(tempBitboards[charPieces.K]), gameState.side, currentMove)) {
            takeBack(copies);
            return 0; // illegal move
        } else {
            return 1; // legal move
        }
    } else {
        if (getMoveCapture(move)) {
            makeMove(move, moveType.ALL_MOVES, currentMove);
        } else {
            return 0; // illegal move
        }
    }
}

/**
 * Decodes an encoded move and prints it.
 * @param move Move to print.
 * @returns Printed list.
 */
export const printMove = (move: number) => {
    let output = "";
    output += (rawPosToNot[getMoveSource(move)] + rawPosToNot[getMoveTarget(move)]
        + promotedPieces[getMovePromoted(move)]);
    return output;
}

/**
 * Prints a decoded list of moves.
 * @param moves List of moves to print.
 */
export const printMoveList = (moves: MoveList) => {
    if (moves.count == 0) {
        console.log("Move list is empty.");
        return;
    }

    let output = "";
    output += ("move   piece  capture  double  enpassant  castling\n");
    for (let moveCount = 0; moveCount < moves.count; moveCount++) {
        const move = moves.moves[moveCount];
        output += rawPosToNot[getMoveSource(move)] + rawPosToNot[getMoveTarget(move)] + (getMovePromoted(move) ? promotedPieces[getMovePromoted(move)] : ' ') + "  " + unicodePieces[getMovePiece(move)]
            + "     " + (getMoveCapture(move) ? 1 : 0) + "        " + (getMoveDouble(move) ? 1 : 0) + "       " + (getMoveEnpassant(move) ? 1 : 0) + "          " + (getMoveCastle(move) ? 1 : 0) + "\n";
    }
    output += `Total moves: ${moves.count}\n`;
    console.log(output);
}

export default null;