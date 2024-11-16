import { MetaProvider, Title } from "@solidjs/meta";
import { Accessor, createMemo, createSignal, JSX, onMount } from "solid-js";
import initLeaperAttacks, { initSliderAttacks } from "./pieces/init";
import { sliders, WIDTH, HEIGHT, BOARD_SIZE, charPieces, unicodePieces, colors, DARK_HIGHLIGHTED, LIGHT_HIGHLIGHTED, gameState } from "./consts/board";
import { getBit } from "./utils/board/bitboard";
import { parseFEN } from "./utils/fen";
import { isDarkSquare } from "./utils/board/squarehelper";
import { getMoveSource, getMoveTarget, MoveList } from "./utils/move/movedef";
import { generateMoves } from "./utils/move/legalmovegenerator";
import { moveType } from "./consts/move";
import { makeMove } from "./utils/move/move";
import { copyBoard, takeBack } from "./utils/board/copy";
import { resetGameState } from "./utils/board/game";

export interface Position {
  x: number;
  y: number;
}

export type Colors = {
  WHITE: number;
  BLACK: number;
  BOTH: number;
};

export type Sliders = {
  ROOK: number;
  BISHOP: number;
}

// FEN board positions
const emptyBoard = "8/8/8/8/8/8/8/8 b - - ";
const startPosition = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const trickyPosition = "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - ";
const killerPosition = "rnbqkb1r/pp1p1pPp/8/2p1pP2/1P1P4/3P3P/P1P1P3/RNBQKBNR w KQkq e6 0 1";
const cmkPosition = "r2q1rk1/ppp2ppp/2n1bn2/2b1p3/3pP3/3P1NPP/PPP1NPB1/R1BQ1RK1 b - - 0 9 ";

export default function Home() {
  const [emptyMoves, setEmptyMoves] = createSignal<MoveList>({ moves: [], count: 0 });
  const [pieces, setPieces] = createSignal<JSX.Element[]>([]);
  const [squares, setSquares] = createSignal<JSX.Element[]>([]);
  const [currentMoves, setCurrentMoves] = createSignal<MoveList>({ moves: [], count: 0 });
  const [currentSquare, setCurrentSquare] = createSignal(-1);
  const [side, setSide] = createSignal(0);

  onMount(() => {
    resetGameState();
    initAll();
    parseFEN(startPosition);
    setSide(gameState.side);
    updateBoard();
  })

  const updateBoard = () => {
    // cache bitboards and moves for quick access
    const movesBySquare = new Map<number, MoveList>();
    setEmptyMoves({ moves: [], count: 0 });
    generateMoves(emptyMoves());
    // precompute moves mapped by source square
    emptyMoves().moves.forEach((move: number) => {
      const source = getMoveSource(move);
      if (!movesBySquare.has(source)) {
        movesBySquare.set(source, { moves: [], count: 0 });
      }
      const moveList = movesBySquare.get(source)!;
      moveList.moves.push(move);
      moveList.count++;
    });

    const newPieces: JSX.Element[] = [];
    const newSquares = squares();

    for (let square = 0; square < BOARD_SIZE * BOARD_SIZE; square++) {
      const i = Math.floor(square / BOARD_SIZE);
      const j = square % BOARD_SIZE;
      const odd = (i + j) % 2;

      let piece = -1;
      for (let bbPiece = charPieces.P; bbPiece <= charPieces.k; bbPiece++) {
        if (getBit(gameState.bitboards[bbPiece], square)) {
          piece = bbPiece;
          break;
        }
      }

      const pieceMoves = movesBySquare.get(square) || { moves: [], count: 0 };
      newPieces.push(
        <Piece piece={piece} odd={odd} square={square} moves={pieceMoves} currentMoves={currentMoves}
          setCurrentMoves={setCurrentMoves} currentSquare={currentSquare} setCurrentSquare={setCurrentSquare}
          side={side} setSide={setSide} />
      );
      if (newSquares.length < 64) {
        newSquares.push(<Square odd={odd} square={square} />);
      }
    }

    setPieces(newPieces);
    setSquares(newSquares);
  };

  const loadBoard = createMemo(() => {
    updateBoard();
    return side();
  })

  // begin the game
  const initAll = () => {
    initLeaperAttacks();
    initSliderAttacks(sliders.BISHOP);
    initSliderAttacks(sliders.ROOK);
  }

  return (
    <MetaProvider>
      <Title>Free Chess</Title>
      <BuildBoard squares={squares} pieces={pieces} />
    </MetaProvider>
  );
}

/**
 * 
 * @param param0 
 * @returns 
 */
const BuildBoard = ({ squares, pieces }: { squares: Accessor<JSX.Element[]>, pieces: Accessor<JSX.Element[]> }) => {
  const boardSizeWidth = WIDTH * BOARD_SIZE;
  const squareStyle = 'absolute left-1/2 top-20 transform -translate-x-1/2 flex flex-wrap flex-row';

  return (
    <>
      <div class={squareStyle} style={{ width: `${boardSizeWidth}px` }}>
        {squares().map((square) => square)}
      </div>
      <div class={`${squareStyle} select-none`} style={{ width: `${boardSizeWidth}px`, height: `${boardSizeWidth}px` }}>
        {pieces().map((piece) => piece)}
      </div>
    </>
  );
};

/**
 * @returns JSX Element of an empty square.
 */
const Square = ({ odd, square }: { odd: number, square: number }) => {
  const colour = odd ? 'bg-slate-700' : 'bg-slate-300';
  const squareStyle = { width: `${WIDTH}px`, height: `${HEIGHT}px` };
  return (
    <div data-square={square} class={`before:content-[''] ${colour}`} style={squareStyle} />
  )
}

/**
 * @returns JSX Element of a piece.
 */
const Piece = ({ piece, odd, square, moves, currentMoves, setCurrentMoves, currentSquare, setCurrentSquare, side, setSide }: {
  piece: number, odd: number, square: number, moves: MoveList, currentMoves: Accessor<MoveList>, setCurrentMoves: (value: MoveList) => void, currentSquare: Accessor<number>,
  setCurrentSquare: (value: number) => void, side: Accessor<number>, setSide: (value: number) => void
}) => {
  const colour = odd ? 'text-slate-300' : 'text-slate-700';
  const background = piece > 5 ? 'bg-slate-900' : piece >= 0 && 'bg-slate-100';
  const squareStyle = { width: `${WIDTH}px`, height: `${HEIGHT}px`, marginTop: '16px' };

  return (
    <div data-piece={square} class={`flex justify-center items-center text-3xl ${colour} ${background} bg-opacity-50`} style={squareStyle}
      onClick={() => currentSquare() == -1 ? pieceClick(piece, moves, square, setCurrentMoves, setCurrentSquare)
        : movePiece(square, currentSquare(), setCurrentSquare, currentMoves(), setCurrentMoves, side, setSide)}>
      {piece != -1 ? unicodePieces[piece] : ''}
    </div>
  )
}

/**
 * Updates graphical interface when clicking on a piece.
 */
const pieceClick = (piece: number, moves: MoveList, square: number, setCurrentMoves: (value: MoveList) => void, setCurrentSquare: (value: number) => void) => {
  const isSide = gameState.side == colors.WHITE ? piece < 6 : piece >= 6;

  // get any currently selected squares
  const selectedDivs: NodeListOf<HTMLElement> = document.querySelectorAll('div[data-selected="true"]');
  selectedDivs.forEach((selectedDiv: HTMLElement) => {
    selectedDiv.style.backgroundColor = '';
  });

  if (!isSide) {
    return
  };

  // remove illegal moves
  for (let moveCount = 0; moveCount < moves.count; moveCount++) {
    const copies = copyBoard();
    if (!(makeMove(moves.moves[moveCount], moveType.ALL_MOVES))) {
      moves.moves.splice(moveCount, 1);
      moves.count--;
      moveCount--;
      continue;
    }
    takeBack(copies);
  }

  setCurrentMoves(moves);
  setCurrentSquare(square);

  // loop over current moves
  for (let moveCount = 0; moveCount < moves.count; moveCount++) {
    const targetSquare = getMoveTarget(moves.moves[moveCount]);
    const dark = isDarkSquare(targetSquare); // styling stuff
    const squareDiv: HTMLElement = document.querySelector(`[data-square="${targetSquare}"]`) as HTMLElement;

    if (squareDiv) {
      squareDiv.setAttribute('data-selected', 'true');
      squareDiv.style.backgroundColor = dark ? DARK_HIGHLIGHTED : LIGHT_HIGHLIGHTED;
    }
  }
}

/**
 * Move a piece (updates graphically).
 */
const movePiece = (square: number, currentSquare: number, setCurrentSquare: (value: number) => void, moves: MoveList, setCurrentMoves: (value: MoveList) => void, side: Accessor<number>, setSide: (value: number) => void) => {
  let canMove = false;
  let nextMove: number = 0;
  let targetSquare = 0;

  // get any currently selected squares
  if (currentSquare != -1) {
    const selectedDivs: NodeListOf<HTMLElement> = document.querySelectorAll('div[data-selected="true"]');
    selectedDivs.forEach((selectedDiv: HTMLElement) => {
      selectedDiv.style.backgroundColor = '';
    });
  }

  // check if attempted square matches move target square
  for (let move of moves.moves) {
    if (getMoveTarget(move) == square) {
      canMove = true;
      nextMove = move;
      targetSquare = square;
    }
  }

  // handle stuff with de-selecting
  if (canMove) {
    makeMove(nextMove, moveType.ALL_MOVES);
    setSide(side() ^ 1);
    setCurrentSquare(-1);
  } else {
    setCurrentMoves({ moves: [], count: 0 });
    setCurrentSquare(-1);
  }
}