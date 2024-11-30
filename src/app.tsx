import { Accessor, createEffect, createMemo, createSignal, JSX, onCleanup, onMount, type Component } from 'solid-js';
import { BOARD_SIZE, colors, DARK_HIGHLIGHTED, DARK_SELECTED, gameState, getBitboard, HEIGHT, LIGHT_HIGHLIGHTED, LIGHT_SELECTED, moveType, unicodePieces, WIDTH } from './game/consts/board';
import { initGame, initGameState, resetGameState } from './game/init/game';
import { addBishop, addKing, addKnight, addPawn, addPogoPiece, addQueen, addRook } from './game/init/addpiece';
import { parseFEN } from './game/fen';
import { getBit, getPieceByID } from './game/board/bitboard';
import { isDarkSquare, rawPosToNot } from './game/board/squarehelper';
import { getMovePiece, getMoveSource, getMoveTarget, MoveList } from './game/move/movedef';
import { makeMove } from './game/move/move';
import { generateMove, generateMoves } from './game/move/legalmovegenerator';
import { copyBoard, takeBack } from './game/board/copy';
import { MetaProvider, Title } from '@solidjs/meta';

const startPosition = "[7][3][5][9][11][5][3][7]/[1][1][1][1][1][1][1][1]/8/8/8/8/[0][0][0][0][0][0][0][0]/[6][2][4][8][10][4][2][6] w KQkq - 0 1"
const pogoPosition = "[7][3][5][9][11][5][3][7]/[1][1][13][13][13][1][1][1]/8/8/8/8/[0][0][0][12][12][12][0][0]/[6][2][4][8][10][4][2][6] w KQkq - 0 1";
const trickyPosition = "[7]3[11]2[7]/[1]1[1][1][9][1][5]1/[5][3]2[1][3][1]1/3[0][2]3/1[1]2[0]3/2[2]2[8]1[1]/[0][0][0][4][4][0][0][0]/[6]3[10]2[6] w KQkq - ";
const enpassantPosition = "8/2[1]5/3[1]4/[10][0]5[7]/1[6]3[1]1[11]/8/4[0]1[0]1/8 w - -"

const App: Component = () => {
  const [emptyMoves, setEmptyMoves] = createSignal<MoveList>({ moves: [], count: 0 });
  const [pieces, setPieces] = createSignal<JSX.Element[]>([]);
  const [squares, setSquares] = createSignal<JSX.Element[]>([]);
  const [currentMoves, setCurrentMoves] = createSignal<MoveList>({ moves: [], count: 0 });
  const [currentSquare, setCurrentSquare] = createSignal(-1);
  const [side, setSide] = createSignal(0);

  let boardRef!: HTMLDivElement;

  const handleDeselect = (e: MouseEvent) => {
    if (boardRef && !boardRef.contains(e.target as Node)) {
      setCurrentSquare(-1);
    }
  };

  createEffect(() => {
    if (currentSquare() == -1) {
      const selectedDivs: NodeListOf<HTMLElement> = document.querySelectorAll('div[data-selected="true"]');
      selectedDivs.forEach((selectedDiv: HTMLElement) => {
        selectedDiv.style.backgroundColor = '';
      });
    }
  })

  onMount(() => {
    resetGameState();
    document.addEventListener("mousedown", handleDeselect);

    // GAME PIECES
    addPawn();
    addKnight();
    addBishop();
    addRook();
    addQueen();
    addKing();
    addPogoPiece();

    initGameState();
    parseFEN(pogoPosition);
    initGame();
    updateBoard();
  })

  onCleanup(() => {
    document.removeEventListener("mousedown", handleDeselect);
  });

  const updateBoard = () => {
    // cache bitboards and moves for quick access
    const movesBySquare = new Map<number, MoveList>();
    generateMoves(emptyMoves(), gameState.pieces);

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
    const newSquares: JSX.Element[] = [];

    for (let square = 0; square < BOARD_SIZE * BOARD_SIZE; square++) {
      const i = Math.floor(square / BOARD_SIZE);
      const j = square % BOARD_SIZE;
      const odd = (i + j) % 2;
      let piece = -1;

      for (let bbPiece of gameState.whitePieceIDs) {
        if (getBit(getBitboard(bbPiece).bitboard, square)) {
          piece = bbPiece;
          break;
        }
      }

      for (let bbPiece of gameState.blackPieceIDs) {
        if (getBit(getBitboard(bbPiece).bitboard, square)) {
          piece = bbPiece;
          break;
        }
      }

      const pieceMoves = movesBySquare.get(square) || { moves: [], count: 0 };
      newPieces.push(
        <PieceGraphic piece={piece} square={square} moves={pieceMoves} currentMoves={currentMoves} setCurrentMoves={setCurrentMoves}
          emptyMoves={emptyMoves} setEmptyMoves={setEmptyMoves} currentSquare={currentSquare} setCurrentSquare={setCurrentSquare} side={side} setSide={setSide} />
      );

      // Add the square (empty or with piece) to the newSquares array
      newSquares.push(<Square odd={odd} square={square} />);
    }

    setPieces(newPieces);
    setSquares(newSquares);
  };

  const loadBoard = createMemo(() => {
    if (gameState.pieces.length != 0) {
      updateBoard();
    }
    return side();
  })

  return (
    <MetaProvider>
      <Title>Free Chess</Title>
      <BuildBoard ref={boardRef} squares={squares} pieces={pieces} />
    </MetaProvider>
  );
};

/**
 * JSX element of the Chess board containing square and piece child elements.
 * @param squares JSX element of squares (empty squares) in the board's background.
 * @param pieces List of pieces currently available on the board.
 * @returns JSX element of the Chess board & children elements.
 */
const BuildBoard = ({ ref, squares, pieces }: { ref: HTMLDivElement, squares: Accessor<JSX.Element[]>, pieces: Accessor<JSX.Element[]> }) => {
  const boardSizeWidth = WIDTH * BOARD_SIZE;
  const squareStyle = 'absolute left-1/2 top-16 transform -translate-x-1/2 flex flex-wrap flex-row';

  return (
    <div ref={ref}>
      <div class={`rounded-lg ${squareStyle}`} style={{ width: `${boardSizeWidth}px` }}>
        {squares().map((square) => square)}
      </div>
      <div class={`${squareStyle} select-none cursor-pointer`} style={{ width: `${boardSizeWidth}px`, height: `${boardSizeWidth}px` }}>
        {pieces().map((piece) => piece)}
      </div>
    </div>
  );
};

/**
 * JSX Element for an empty square as seen in the background of the board.
 * @odd Calculated using index of the square to give the board its checkered pattern.
 * @square Square ID used for moving square divs and pieces.
 * @returns JSX Element of an empty square.
 */
const Square = ({ odd, square }: { odd: number, square: number }) => {
  const colour = odd ? 'bg-[#B58863]' : 'bg-[#F0D9B5]';
  const squareStyle = { width: `${WIDTH}px`, height: `${HEIGHT}px` };

  return (
    <div data-square={square} class={`before:content-[''] ${colour}`} style={squareStyle} />
  )
}

/**
 * @returns JSX Element of a piece.
 */
const PieceGraphic = ({ piece, square, moves, currentMoves, setCurrentMoves, emptyMoves, setEmptyMoves, currentSquare, setCurrentSquare, side, setSide }: {
  piece: number, square: number, moves: MoveList, currentMoves: Accessor<MoveList>, setCurrentMoves: (value: MoveList) => void, emptyMoves: Accessor<MoveList>,
  setEmptyMoves: (value: MoveList) => void, currentSquare: Accessor<number>, setCurrentSquare: (value: number) => void, side: Accessor<number>, setSide: (value: number) => void
}) => {
  const squareStyle = { width: `${WIDTH}px`, height: `${HEIGHT}px`, marginTop: '16px' };
  const isSide = gameState.side == colors.WHITE ? gameState.whitePieceIDs.includes(piece) : gameState.blackPieceIDs.includes(piece);

  return (
    <div data-piece={square} class={`flex justify-center items-center text-3xl bg-opacity-50`} style={squareStyle}
      onClick={() => {
        if (currentSquare() === -1) {
          pieceClick(piece, moves, square, setCurrentMoves, setCurrentSquare);
        } else {
          (piece !== -1 && isSide) ? pieceClick(piece, moves, square, setCurrentMoves, setCurrentSquare) :
            movePiece(square, setCurrentSquare, currentMoves(), setCurrentMoves, emptyMoves, setEmptyMoves, side, setSide);
        }
      }}>
      {piece != -1 ? <img src={`/piece/${piece}.png`} width="60" height="60" draggable="false" /> : ''}
    </div>
  )
}

/**
 * Updates graphical interface when clicking on a piece.
 */
const pieceClick = (piece: number, moves: MoveList, square: number, setCurrentMoves: (value: MoveList) => void, setCurrentSquare: (value: number) => void) => {
  const isSide = gameState.side == colors.WHITE ? gameState.whitePieceIDs.includes(piece) : gameState.blackPieceIDs.includes(piece);
  // get any currently selected squares
  const selectedDivs: NodeListOf<HTMLElement> = document.querySelectorAll('div[data-selected="true"]');
  selectedDivs.forEach((selectedDiv: HTMLElement) => {
    selectedDiv.style.backgroundColor = '';
    selectedDiv.setAttribute('data-selected', 'false');
  });

  if (!isSide) {
    setCurrentMoves({ moves: [], count: 0 });
    setCurrentSquare(-1);
    return;
  }

  // remove illegal moves
  for (let moveCount = 0; moveCount < moves.count; moveCount++) {
    const copies = copyBoard();
    if (!(makeMove(moves.moves[moveCount], moveType.ALL_MOVES, 0))) {
      moves.moves.splice(moveCount, 1);
      moves.count--;
      moveCount--;
      continue;
    }
    takeBack(copies);
  }

  setCurrentMoves(moves);
  setCurrentSquare(square);

  // change colour of current square
  const darkSource = isDarkSquare(square);
  const sourceDiv: HTMLElement = document.querySelector(`[data-square="${square}"]`) as HTMLElement;

  if (sourceDiv) {
    sourceDiv.setAttribute('data-selected', 'true');
    sourceDiv.style.backgroundColor = darkSource ? DARK_SELECTED : LIGHT_SELECTED;
  }

  // loop over current moves
  for (let moveCount = 0; moveCount < moves.count; moveCount++) {
    const targetSquare = getMoveTarget(moves.moves[moveCount]);
    const darkTarget = isDarkSquare(targetSquare); // styling stuff
    const targetDiv: HTMLElement = document.querySelector(`[data-square="${targetSquare}"]`) as HTMLElement;

    if (targetDiv && sourceDiv) {
      targetDiv.setAttribute('data-selected', 'true');
      targetDiv.style.backgroundColor = darkTarget ? DARK_HIGHLIGHTED : LIGHT_HIGHLIGHTED;
    }
  }
}

/**
 * Move a piece (updates graphically).
 */
const movePiece = (square: number, setCurrentSquare: (value: number) => void, moves: MoveList, setCurrentMoves: (value: MoveList) => void,
  emptyMoves: Accessor<MoveList>, setEmptyMoves: (value: MoveList) => void, side: Accessor<number>, setSide: (value: number) => void) => {
  let canMove = false;
  let nextMove: number = 0;

  // check if attempted square matches move target square
  for (let move of moves.moves) {
    if (getMoveTarget(move) == square) {
      canMove = true;
      nextMove = move;
      break;
    }
  }

  // handle stuff with de-selecting
  if (canMove) {
    const piece = getMovePiece(nextMove);

    if (makeMove(nextMove, moveType.ALL_MOVES, 0)) {
      setCurrentMoves({ moves: [], count: 0 });
      setEmptyMoves({ moves: [], count: 0 });
      generateMove(emptyMoves(), getPieceByID(piece)!);

      setSide(side() ^ 1);
      setCurrentSquare(-1);
    }
  } else { // possibly clicked another piece
    setCurrentMoves({ moves: [], count: 0 });
    setCurrentSquare(-1);
  }
}

export default App;
