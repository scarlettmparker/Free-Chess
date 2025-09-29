import { createSignal, For, type Component, Show, onCleanup } from 'solid-js';
import { getBit, getLSFBIndex } from '~/game/board/bitboard';
import {
  PlayerColor,
  gameState,
  moveType,
  BOARD_SIZE,
  getBitboard,
  colors,
  charPieces,
} from '~/game/consts/board';
import { generateMoves } from '~/game/move/legal-move-generator';
import { makeMove } from '~/game/move/move';
import { MoveList, getMovePiece, getMoveSource, getMoveTarget } from '~/game/move/move-def';
import { mountGame } from '~/utils';
import { tryConnectFlow, setStoredSession } from '~/utils/connect';
import { deserializeGameState } from '~/utils/game-serialize';
import Board from './board';
import Piece from './piece';
import Square from './square';
import { playMoveSound } from '~/game/sound/play';
import { isSquareAttacked } from '~/game/board/attacks';

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

const Game: Component = () => {
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

    if (socket) {
      socket.onmessage = (ev) => {
        let msg;
        try {
          msg = JSON.parse(ev.data);
        } catch (e) {
          return; // ignore json
        }

        if (msg.type === 'state' && msg.state) {
          Object.assign(gameState, deserializeGameState(msg.state));
          updateBoard();
        } else if (msg.type === 'opponent_move' && msg.move) {
          makeMove(msg.move, moveType.ALL_MOVES, 0);
          playMoveSound(msg.move);
        }
      };
    }
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
    gameState.checked = [false, false];

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
      if (piece === undefined || piece === null) {
        for (const bbPiece of gameState.blackPieceIds) {
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

    // check if king is in check
    const sideToMove = gameState.side;
    const opponent = sideToMove ^ 1;

    const kingSquare =
      sideToMove === colors.WHITE
        ? getLSFBIndex(getBitboard(charPieces.K).bitboard) // white king
        : getLSFBIndex(getBitboard(charPieces.k).bitboard); // black king

    gameState.checked[gameState.side] = isSquareAttacked(kingSquare, opponent);

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
        if (socket) {
          socket.send(JSON.stringify({ type: 'move', move: found }));
        }
        playMoveSound(found);
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
    <div class="flex flex-col gap-4">
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
                onClick={() => playerColor() == gameState.side && handleSquareClick(squareIndex)}
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
                        playerColor={playerColor}
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
    </div>
  );
};

export default Game;
