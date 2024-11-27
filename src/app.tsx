import { Accessor, createMemo, createSignal, JSX, onMount, type Component } from 'solid-js';
import { Piece } from './game/piece/piece';
import { BOARD_SIZE, charPieces, colors, DARK_HIGHLIGHTED, gameState, HEIGHT, LIGHT_HIGHLIGHTED, moveType, unicodePieces, WIDTH } from './game/consts/board';
import { initGame, initGameState, resetGameState } from './game/init/game';
import { parseFEN } from './game/utils/fen';
import { getBit } from './game/utils/board/bitboard';
import { perftDriver } from './game/utils/perft';
import { isDarkSquare } from './game/utils/board/squarehelper';
import { getMoveSource, getMoveTarget, MoveList } from './game/utils/move/movedef';
import { makeMove } from './game/utils/move/move';
import { generateMoves } from './game/utils/move/legalmovegenerator';
import { copyBoard, takeBack } from './game/utils/board/copy';
import { MetaProvider, Title } from '@solidjs/meta';
import { printAttackedSquares } from './game/utils/board/attacks';

const startPosition = "[7][3][5][9][11][5][3][7]/[1][1][1][1][1][1][1][1]/8/8/8/8/[0][0][0][0][0][0][0][0]/[6][2][4][8][10][4][2][6] w KQkq - 0 1";
const trickyPosition = "[7]3[11]2[7]/[1]1[1][1][9][1][5]1/[5][3]2[1][3][1]1/3[0][2]3/1[1]2[0]3/2[2]2[8]1[1]/[0][0][0][4][4][0][0][0]/[6]3[10]2[6] w KQkq - ";
const enpassantPosition = "8/2[1]5/3[1]4/[10][0]5[7]/1[6]3[1]1[11]/8/4[0]1[0]1/8 w - -"

const App: Component = () => {
  const [emptyMoves, setEmptyMoves] = createSignal<MoveList>({ moves: [], count: 0 });
  const [pieces, setPieces] = createSignal<JSX.Element[]>([]);
  const [squares, setSquares] = createSignal<JSX.Element[]>([]);
  const [currentMoves, setCurrentMoves] = createSignal<MoveList>({ moves: [], count: 0 });
  const [currentSquare, setCurrentSquare] = createSignal(-1);
  const [side, setSide] = createSignal(0);
  
  onMount(() => {
    resetGameState();

    // PAWNS
    const WhitePawn = new Piece(0, 0);
    WhitePawn.setPawn(true);
    WhitePawn.setEnpassant(true);
    WhitePawn.setPromote(true);

    const BlackPawn = new Piece(1, 1);
    BlackPawn.setPawn(true);
    BlackPawn.setEnpassant(true);
    BlackPawn.setPromote(true);

    gameState.pieces.push(WhitePawn);
    gameState.pieces.push(BlackPawn);

    // KNIGHTS
    const WhiteKnight = new Piece(2, 0);
    WhiteKnight.setLeaper(true);
    WhiteKnight.setLeaperOffsets([[
      [-2, 1], [-1, 2], [1, 2], [2, 1],
      [-2, -1], [-1, -2], [1, -2], [2, -1],
    ]]);

    const BlackKnight = new Piece(3, 1);
    BlackKnight.setLeaper(true);
    BlackKnight.setLeaperOffsets([[
      [-2, 1], [-1, 2], [1, 2], [2, 1],
      [-2, -1], [-1, -2], [1, -2], [2, -1],
    ]]);

    gameState.pieces.push(WhiteKnight);
    gameState.pieces.push(BlackKnight);

    // BISHOPS
    const WhiteBishop = new Piece(4, 0);
    WhiteBishop.setSlider(true);
    WhiteBishop.setDiagonal(true);

    const BlackBishop = new Piece(5, 1);
    BlackBishop.setSlider(true);
    BlackBishop.setDiagonal(true);

    gameState.pieces.push(WhiteBishop);
    gameState.pieces.push(BlackBishop);

    // ROOKS
    const WhiteRook = new Piece(6, 0);
    WhiteRook.setSlider(true);
    WhiteRook.setStraight(true);

    const BlackRook = new Piece(7, 1);
    BlackRook.setSlider(true);
    BlackRook.setStraight(true);

    gameState.pieces.push(WhiteRook);
    gameState.pieces.push(BlackRook);

    // QUEENS
    const WhiteQueen = new Piece(8, 0);
    WhiteQueen.setSlider(true);
    WhiteQueen.setDiagonal(true);
    WhiteQueen.setStraight(true);

    const BlackQueen = new Piece(9, 1);
    BlackQueen.setSlider(true);
    BlackQueen.setDiagonal(true);
    BlackQueen.setStraight(true);

    gameState.pieces.push(WhiteQueen);
    gameState.pieces.push(BlackQueen);

    // KINGS
    const WhiteKing = new Piece(10, 0);
    WhiteKing.setKing(true);
    WhiteKing.setLeaper(true);
    WhiteKing.setLeaperOffsets([[
      [-1, 1], [0, 1], [1, 1], [-1, 0],
      [1, 0], [-1, -1], [0, -1], [1, -1]
    ]]);

    const BlackKing = new Piece(11, 1);
    BlackKing.setKing(true);
    BlackKing.setLeaper(true);
    BlackKing.setLeaperOffsets([[
      [-1, 1], [0, 1], [1, 1], [-1, 0],
      [1, 0], [-1, -1], [0, -1], [1, -1]
    ]]);

    gameState.pieces.push(WhiteKing);
    gameState.pieces.push(BlackKing);

    initGameState();
    parseFEN(startPosition);
    initGame();
    updateBoard();
  })

  const updateBoard = () => {
    // cache bitboards and moves for quick access
    const movesBySquare = new Map<number, MoveList>();
    setEmptyMoves({ moves: [], count: 0 });
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
      for (let bbPiece = charPieces.P; bbPiece <= charPieces.k; bbPiece++) {
        if (getBit(gameState.bitboards[bbPiece], square)) {
          piece = bbPiece;
          break;
        }
      }
  
      const pieceMoves = movesBySquare.get(square) || { moves: [], count: 0 };
      newPieces.push(
        <PieceGraphic piece={piece} square={square} moves={pieceMoves} currentMoves={currentMoves}
          setCurrentMoves={setCurrentMoves} currentSquare={currentSquare} setCurrentSquare={setCurrentSquare}
          side={side} setSide={setSide} />
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
      <BuildBoard squares={squares} pieces={pieces} />
    </MetaProvider>
  );
};

/**
 * JSX element of the Chess board containing square and piece child elements.
 * @param squares JSX element of squares (empty squares) in the board's background.
 * @param pieces List of pieces currently available on the board.
 * @returns JSX element of the Chess board & children elements.
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
 * JSX Element for an empty square as seen in the background of the board.
 * @odd Calculated using index of the square to give the board its checkered pattern.
 * @square Square ID used for moving square divs and pieces.
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
const PieceGraphic = ({ piece, square, moves, currentMoves, setCurrentMoves, currentSquare, setCurrentSquare, side, setSide }: {
  piece: number, square: number, moves: MoveList, currentMoves: Accessor<MoveList>, setCurrentMoves: (value: MoveList) => void, currentSquare: Accessor<number>,
  setCurrentSquare: (value: number) => void, side: Accessor<number>, setSide: (value: number) => void
}) => {
  const squareStyle = { width: `${WIDTH}px`, height: `${HEIGHT}px`, marginTop: '16px' };

  return (
    <div data-piece={square} class={`flex justify-center items-center text-3xl bg-opacity-50`} style={squareStyle}
      onClick={() => currentSquare() == -1 ? pieceClick(piece, moves, square, setCurrentMoves, setCurrentSquare)
        : movePiece(square, currentSquare(), setCurrentSquare, currentMoves(), setCurrentMoves, side, setSide)}>
      {piece != -1 ? <img src={`/piece/${piece}.png`} width="54" height="54" /> : ''}
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
  });

  if (!isSide) {
    return;
  };

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
    }
  }

  // handle stuff with de-selecting
  if (canMove) {
    makeMove(nextMove, moveType.ALL_MOVES, 0);
    setSide(side() ^ 1);
    setCurrentSquare(-1);
  } else {
    setCurrentMoves({ moves: [], count: 0 });
    setCurrentSquare(-1);
  }
}

export default App;
