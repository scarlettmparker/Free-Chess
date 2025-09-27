import { MetaProvider, Title } from '@solidjs/meta';
import { createSignal, For, type Component, Show, onCleanup } from 'solid-js';
import {
  BOARD_SIZE,
  gameState,
  getBitboard,
  moveType,
  type PlayerColor,
} from './game/consts/board';
import { tryConnectFlow, setStoredSession } from './utils/connect';

import { getBit } from './game/board/bitboard';
import { getMovePiece, getMoveSource, getMoveTarget, MoveList } from './game/move/move-def';
import { generateMoves } from './game/move/legal-move-generator';
import { mountGame } from './utils';
import Board from './_components/board';
import Piece from './_components/piece';
import Square from './_components/square';
import { makeMove } from './game/move/move';

const EMPTY_MOVE_LIST: MoveList = { moves: [], count: 0 };

type PieceMoveKey = {
  /**
   * Key of piece on board.
   */
  key: number;

  /**
   * Idof the piece at that square.
   */
  pieceId?: number;

  /**
   * Move list for matching piece.
   */
  moves?: MoveList;
};

const App: Component = () => {
  const [moves, setMoves] = createSignal<MoveList>(EMPTY_MOVE_LIST);
  const [pieceMoveKey, setPieceMoveKey] = createSignal<PieceMoveKey[]>([]);
  const [playerColor, setPlayerColor] = createSignal<PlayerColor | null>(null);

  // websocket / session state
  let socket: WebSocket | null = null;
  const WS_URL = (import.meta.env.VITE_PUBLIC_API_URL as string) || 'ws://localhost:4000';

  // initialize connection
  (async () => {
    socket = await tryConnectFlow(WS_URL, (msg) => {
      if (msg.sessionId) setStoredSession(msg.sessionId);
      if (msg.color) setPlayerColor(msg.color === 'white' ? 0 : 1);
      else if (msg.status === 'spectator') setPlayerColor(null);
    });
  })();

  /**
   * Close socket.
   */
  onCleanup(() => {
    if (socket) {
      try {
        socket.close();
      } catch (e) {
        // do nothing
      }
    }
  });

  /**
   * Generate moves (client side) after a piece has moved.
   * We know how this will be done server side.
   */
  const updateBoard = () => {
    // Store bitboards and moves
    const moves: MoveList = { moves: [], count: 0 };
    generateMoves(moves, gameState.pieces);

    // Precompute moves mapped by piece id (source piece)
    const movesByPieceAndSquare = new Map<string, MoveList>();

    moves.moves.forEach((move: number) => {
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
      for (const bbPiece of gameState.whitePieceIds) {
        if (getBit(getBitboard(bbPiece).bitboard, square)) {
          piece = bbPiece;
          break;
        }
      }

      // only check black if piece is still undefined/null (handle pieceId === 0)
      // if (piece === undefined || piece === null) {
      for (const bbPiece of gameState.blackPieceIds) {
        if (getBit(getBitboard(bbPiece).bitboard, square)) {
          piece = bbPiece;
          break;
        }
      }
      // }

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
    setMoves(EMPTY_MOVE_LIST);
  };

  /**
   * Handle clicking a square (select a piece or move it).
   *
   * @param squareKey Square clicked.
   */
  const handleSquareClick = (squareKey: number) => {
    const moveList = moves();
    if (!moveList || moveList.count === 0) {
      setMoves(EMPTY_MOVE_LIST);
      return;
    }

    const found = moveList.moves.find((m) => getMoveTarget(m) === squareKey);
    if (found !== undefined) {
      const ok = makeMove(found, moveType.ALL_MOVES, 0);
      // we can move
      if (ok) {
        updateBoard();
      } else {
        setMoves(EMPTY_MOVE_LIST);
      }
    } else {
      setMoves(EMPTY_MOVE_LIST);
    }
  };

  mountGame();
  // Draw the pieces
  updateBoard();

  return (
    <MetaProvider>
      <Title>Free Chess</Title>
      <div class="absolute left-1/2 transform -translate-x-1/2 my-16 flex flex-col gap-4">
        <Board class={`${playerColor() === 1 && ''}`}>
          <For
            each={
              playerColor() === 1
                ? Array.from(
                    { length: BOARD_SIZE * BOARD_SIZE },
                    (_, i) => BOARD_SIZE * BOARD_SIZE - 1 - i,
                  )
                : Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, i) => i)
            }
          >
            {(squareIndex) => {
              return (
                <Square
                  key={squareIndex}
                  moves={moves}
                  playerColor={playerColor}
                  onClick={() => handleSquareClick(squareIndex)}
                >
                  {(() => {
                    const pieceKeysBySquare = pieceMoveKey().reduce((arr, p) => {
                      arr[p.key] = p;
                      return arr;
                    }, [] as PieceMoveKey[]);
                    const entry = pieceKeysBySquare[squareIndex];
                    const pieceId = entry?.pieceId;

                    return (
                      <Show when={pieceId != null}>
                        <Piece
                          pieceId={pieceId!}
                          moves={entry.moves ?? EMPTY_MOVE_LIST}
                          setMoves={setMoves}
                        />
                      </Show>
                    );
                  })()}
                </Square>
              );
            }}
          </For>
        </Board>
        <span class="text-white ml-auto">Player: {playerColor()}</span>
      </div>
    </MetaProvider>
  );
};

export default App;
