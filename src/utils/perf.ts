import { bitboards, captures, castle, castles, checks, enpassant, nodes, promotions, setCaptures, setCastles, setChecks, setNodes, setPromotions, side } from "~/consts/board"
import { getMoveCapture, getMoveCastle, getMovePromoted, MoveList } from "./move/movedef";
import { generateMoves } from "./move/legalmovegenerator";
import { moveType } from "~/consts/move";
import { copyBoard, takeBack } from "./board/copy";
import { makeMove } from "./move/move";

/**
 * Performance test & move path enumeration
 * @param depth Number of moves from root
 */
export const perftDriver = (depth: number) => {
    if (depth == 0) {
        let currNodes = nodes();
        currNodes++;
        setNodes(currNodes);
        return;
    }


    let moves: MoveList = { moves: [], count: 0 };
    generateMoves(moves);

    // go through generated moves
    for (let moveCount = 0; moveCount < moves.count; moveCount++) {
        const copies = copyBoard();

        if (!(makeMove(moves.moves[moveCount], moveType.ALL_MOVES))) {
            continue;
        }

        // call perft driver recursively
        perftDriver(depth - 1);
        takeBack(copies);
    }
    
}