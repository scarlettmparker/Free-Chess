import { bitboards, castle, charPieces, colors, enpassant, occupancies, setCastle, setEnpassant, setOccupancies, setSide, side, unicodePieces } from "~/consts/board";
import { notToRawPos, rawPosToNot } from "../board/squarehelper"
import { getMoveCapture, getMoveCastle, getMoveDouble, getMoveEnpassant, getMovePiece, getMovePromoted, getMoveSource, getMoveTarget, MoveList, promotedPieces } from "./movedef"
import { moveType } from "~/consts/move";
import { copyBoard, takeBack } from "../board/copy";
import { getBit, getLSFBIndex, printBoard, updateBitboard } from "../board/bitboard";
import { getter, setter } from "../bigint";
import { castlingRights } from "~/consts/bits";
import { isSquareAttacked } from "../board/attacks";
import { createSignal } from "solid-js";

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
export const makeMove = (move: number, moveFlag: number) => {
    if (moveFlag == moveType.ALL_MOVES) {
        const copies = copyBoard();

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
        updateBitboard(getter(bitboards, piece)(), setter(bitboards, piece), sourceSquare, false);
        updateBitboard(getter(bitboards, piece)(), setter(bitboards, piece), targetSquare, true);

        // captures
        if (capture) {
            let startPiece, endPiece;
            if (side() == colors.WHITE) {
                startPiece = charPieces.p;
                endPiece = charPieces.k;
            } else {
                startPiece = charPieces.P;
                endPiece = charPieces.K;
            }

            // loop over bitboard of opposite side
            for (let bbPiece = startPiece; bbPiece <= endPiece; bbPiece++) {
                if (getBit(getter(bitboards, bbPiece)(), targetSquare)) { // piece on target square
                    updateBitboard(getter(bitboards, bbPiece)(), setter(bitboards, bbPiece), targetSquare, false);
                    break;
                }
            }
        }

        // promotions
        if (promoted) {
            updateBitboard(getter(bitboards, side() == colors.WHITE ? charPieces.P : charPieces.p)(),
                setter(bitboards, side() == colors.WHITE ? charPieces.P : charPieces.p), targetSquare, false);
            updateBitboard(getter(bitboards, promoted)(), setter(bitboards, promoted), targetSquare, true);
        }

        // en passant
        if (enpassantFlag) {
            (side() == colors.WHITE) ? updateBitboard(getter(bitboards, charPieces.p)(), setter(bitboards, charPieces.p), targetSquare + 8, false)
                : updateBitboard(getter(bitboards, charPieces.P)(), setter(bitboards, charPieces.P), targetSquare - 8, false);
        }
        setEnpassant(-1);

        // double pawn push
        if (double) {
            (side() == colors.WHITE) ? setEnpassant(targetSquare + 8) : setEnpassant(targetSquare - 8);
        }

        // castling moves
        if (castling) {
            switch (targetSquare) {
                case (notToRawPos["g1"]):
                    updateBitboard(getter(bitboards, charPieces.R)(), setter(bitboards, charPieces.R), notToRawPos["h1"], false);
                    updateBitboard(getter(bitboards, charPieces.R)(), setter(bitboards, charPieces.R), notToRawPos["f1"], true);
                    break;
                case (notToRawPos["c1"]):
                    updateBitboard(getter(bitboards, charPieces.R)(), setter(bitboards, charPieces.R), notToRawPos["a1"], false);
                    updateBitboard(getter(bitboards, charPieces.R)(), setter(bitboards, charPieces.R), notToRawPos["d1"], true);
                    break;
                case (notToRawPos["g8"]):
                    updateBitboard(getter(bitboards, charPieces.r)(), setter(bitboards, charPieces.r), notToRawPos["h8"], false);
                    updateBitboard(getter(bitboards, charPieces.r)(), setter(bitboards, charPieces.r), notToRawPos["f8"], true);
                    break;
                case (notToRawPos["c8"]):
                    updateBitboard(getter(bitboards, charPieces.r)(), setter(bitboards, charPieces.r), notToRawPos["a8"], false);
                    updateBitboard(getter(bitboards, charPieces.r)(), setter(bitboards, charPieces.r), notToRawPos["d8"], true);
                    break;
            }
        }


        // update castling rights
        let newCastle = Number(castle());
        newCastle &= (castlingRights[sourceSquare]);
        newCastle &= (castlingRights[targetSquare]);
        setCastle(BigInt(newCastle));

        // update occupancies
        for (let i = 0; i < 3; i++) {
            const setOccupancy = setter(occupancies, i);
            setOccupancy(0n);
        }

        // update white pieces occupancies
        let whiteOccupancy = getter(occupancies, colors.WHITE)();
        const setWhiteOccupancy = setter(occupancies, colors.WHITE);
        for (let bbPiece = charPieces.P; bbPiece <= charPieces.K; bbPiece++) {
            whiteOccupancy |= getter(bitboards, bbPiece)();
            setWhiteOccupancy(whiteOccupancy);
        }

        // update black pieces occupancies
        let blackOccupancy = getter(occupancies, colors.BLACK)();
        const setBlackOccupancy = setter(occupancies, colors.BLACK);
        for (let bbPiece = charPieces.p; bbPiece <= charPieces.k; bbPiece++) {
            blackOccupancy |= getter(bitboards, bbPiece)();
            setBlackOccupancy(blackOccupancy);
        }

        const setOccupancy = setter(occupancies, colors.BOTH);
        // update both sides occupancies
        let bothOccupancy = whiteOccupancy;
        bothOccupancy |= blackOccupancy;
        setOccupancy(bothOccupancy);

        // change side
        setSide(side() ^ 1);

        // check if king exposed to check
        if (isSquareAttacked((side() == colors.WHITE) ? getLSFBIndex(getter(bitboards, charPieces.k)())
            : getLSFBIndex(getter(bitboards, charPieces.K)()), side())) {
            takeBack(copies);
            return 0; // illegal move
        } else {
            return 1; // legal move
        }
    } else {
        if (getMoveCapture(move)) {
            makeMove(move, moveType.ALL_MOVES);
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