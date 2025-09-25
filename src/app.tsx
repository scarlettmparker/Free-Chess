import { MetaProvider, Title } from "@solidjs/meta";
import { createSignal, type Component } from "solid-js";
import {
  BOARD_SIZE,
  colors,
  gameState,
  getBitboard,
} from "./game/consts/board";

import { getBit } from "./game/board/bitboard";
import { getMovePiece, getMoveSource, MoveList } from "./game/move/movedef";
import { generateMoves } from "./game/move/legalmovegenerator";
import { mountGame } from "./utils";
import Board from "./_components/board";
import Piece from "./_components/piece";
import Square from "./_components/square";

// const startPosition =
// "[7][3][5][9][11][5][3][7]/[1][1][1][1][1][1][1][1]/8/8/8/8/[0][0][0][0][0][0][0][0]/[6][2][4][8][10][4][2][6] w KQkq - 0 1";
const EMPTY_MOVE_LIST: MoveList = { moves: [], count: 0 };

type PieceMoveKey = {
  /**
   * Key of piece on board.
   */
  key: number;

  /**
   * ID of the piece at that square.
   */
  pieceId?: number;

  /**
   * Move list for matching piece.
   */
  moves?: MoveList;
};

const App: Component = () => {
  const [moves, setMoves] = createSignal<MoveList>(EMPTY_MOVE_LIST);
  const [side, setSide] = createSignal(colors.WHITE);
  const [pieceMoveKey, setPieceMoveKey] = createSignal<PieceMoveKey[]>([]);
  const [selectedSquare, setSelectedSquare] = createSignal<number | null>(null);

  /**
   * Generate moves (client side) after a piece has moved.
   * We know how this will be done server side.
   */
  const updateBoard = () => {
    // Store bitboards and moves
    const newMoves: MoveList = { moves: [], count: 0 };
    generateMoves(newMoves, gameState.pieces);

    // Precompute moves mapped by piece id (source piece)
    const movesByPieceAndSquare = new Map<string, MoveList>();

    newMoves.moves.forEach((move: number) => {
      const pieceId = getMovePiece(move);
      const sourceSquare = getMoveSource(move);
      const key = `${pieceId}-${sourceSquare}`;
      let list = movesByPieceAndSquare.get(key);

      // If there is no piece
      if (!list) {
        list = { moves: [], count: 0 };
        movesByPieceAndSquare.set(key, list);
      }
      list.moves.push(move);
      list.count++;
    });

    const updatedKeys: PieceMoveKey[] = [];
    let square; // def square and loop to assign moves to piece keys
    // this also represents the piece key in our starting position
    for (square = 0; square < BOARD_SIZE * BOARD_SIZE; square++) {
      // TODO: want to move this to a helper function and check if it's used elsewhere
      let piece: number | undefined;
      for (let bbPiece of gameState.whitePieceIds) {
        if (getBit(getBitboard(bbPiece).bitboard, square)) {
          piece = bbPiece;
          break;
        }
      }

      // only check black if piece is still undefined/null (handle pieceId === 0)
      if (piece === undefined || piece === null) {
        for (let bbPiece of gameState.blackPieceIds) {
          if (getBit(getBitboard(bbPiece).bitboard, square)) {
            piece = bbPiece;
            break;
          }
        }
      }

      // Push key-move-square values
      updatedKeys.push({
        key: square,
        pieceId: piece,
        moves:
          piece !== undefined && piece !== null
            ? movesByPieceAndSquare.get(`${piece}-${square}`) ?? EMPTY_MOVE_LIST
            : EMPTY_MOVE_LIST,
      });
    }
    setPieceMoveKey(updatedKeys);
  };

  mountGame();
  // Draw the pieces
  updateBoard();

  const pieceKeysBySquare = pieceMoveKey().reduce((arr, p) => {
    arr[p.key] = p;
    return arr;
  }, [] as PieceMoveKey[]);

  return (
    <MetaProvider>
      <Title>Free Chess</Title>
      <Board class="absolute left-1/2 transform -translate-x-1/2 my-16">
        {Array.from({ length: BOARD_SIZE * BOARD_SIZE }).map((_, i) => {
          const entry = pieceKeysBySquare[i];
          const pieceId = entry?.pieceId;

          return (
            <Square
              key={i}
              moves={moves}
              setMoves={setMoves}
              onClick={() => setSelectedSquare(i)}
            >
              {pieceId !== undefined && pieceId !== null ? (
                <Piece
                  pieceId={pieceId}
                  moves={entry.moves ?? EMPTY_MOVE_LIST}
                  setMoves={setMoves}
                />
              ) : (
                <></>
              )}
            </Square>
          );
        })}
      </Board>
    </MetaProvider>
  );
};

export default App;
