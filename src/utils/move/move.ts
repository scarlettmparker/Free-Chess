import { unicodePieces } from "~/consts/board";
import { rawPosToNot } from "../board/squarehelper"
import { getMoveCapture, getMoveCastle, getMoveDouble, getMoveEnpassant, getMovePiece, getMovePromoted, getMoveSource, getMoveTarget, MoveList, promotedPieces } from "./movedef"

/**
 * Adds a move to the move list.
 * @param moveList Move list to add move to.
 * @param move Move to add to move list.
 */
export const addMove = (moveList: MoveList, move: number) => {
    const newMoveList = {
        moves: [...moveList.moves, move],
        count: moveList.count + 1
    };
    return newMoveList;
}
/**
 * Decodes an encoded move and prints it.
 * @param move Move to print.
 * @returns Printed list.
 */
export const printMove = (move: number) => {
    let output = "";
    output += (rawPosToNot(getMoveSource(move)) + rawPosToNot(getMoveTarget(move))
        + promotedPieces[getMovePromoted(move)]);
    return output;
}

/**
 * Prints a decoded list of moves.
 * @param moveList List of moves to print.
 */
export const printMoveList = (moveList: MoveList) => {
    let output = "";
    output += ("move   piece  capture  double  enpassant  castling\n");
    for (let moveCount = 0; moveCount < moveList.count; moveCount++) {
        const move = moveList.moves[moveCount];
        output += (rawPosToNot(getMoveSource(move)) + rawPosToNot(getMoveTarget(move)) + promotedPieces[getMovePromoted(move)] + "  " + unicodePieces[getMovePiece(move)]
            + "     " + (getMoveCapture(move) ? 1 : 0) + "        " + getMoveDouble(move) + "       " + getMoveEnpassant(move) + "          " + getMoveCastle(move)) + "\n";
        output += `Total moves: ${moveList.count}`;

    }
    console.log(output);
}