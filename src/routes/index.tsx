import { MetaProvider, Title } from "@solidjs/meta";
import { Accessor, createEffect, createSignal, JSX } from "solid-js";

// helpers
import setBit from "~/utils/bitboard";
import { BOARD_SIZE, HEIGHT, WIDTH } from "~/consts/board";

// types
import PieceType from '~/components/Piece/type';

// components
import Piece from "~/components/Piece";
import buildBoard from "~/utils/board";
import { handleMouseDown, handleMouseMove, handleMouseUp } from "~/utils/mouse";

export interface Position {
  x: number;
  y: number;
}

export default function Home() {
  const [boardDivs, setBoardDivs] = createSignal<JSX.Element[]>([]);
  const [pieces, setPieces] = createSignal<PieceType[]>([]);
  const [bitBoard, setBitBoard] = createSignal<bigint>(BigInt(0));

  // piece states
  const [draggingPiece, setDraggingPiece] = createSignal<PieceType | null>(null);
  const [dragPos, setDragPos] = createSignal<Position | null>(null);

  createEffect(() => {
    const { divs, piecesList } = buildBoard(BOARD_SIZE, WIDTH, HEIGHT);
    setBoardDivs(divs);
    setPieces(piecesList);
  });

  // example of how to update bit board
  createEffect(() => {
    const currentBitBoard = bitBoard();
    let updatedBitBoard = currentBitBoard;

    // updatedBitBoard = setBit(updatedBitBoard, "e4", true);

    if (updatedBitBoard !== currentBitBoard) {
      setBitBoard(updatedBitBoard);
    }
  }, [bitBoard])

  // deal with event listeners for dragging pieces
  createEffect(() => {
    const onMouseMove = (e: MouseEvent) => handleMouseMove(e, draggingPiece, setDragPos);
    const onMouseUp = () => handleMouseUp(dragPos, setDragPos, draggingPiece, setDraggingPiece, pieces, setPieces);

    // add event listeners when dragging starts
    if (draggingPiece()) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    } else {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    }
  })

  return (
    <MetaProvider>
      <Title>Free Chess</Title>
      <div class='absolute left-1/2 top-32 transform -translate-x-1/2 flex flex-row flex-wrap' style={{ width: `${WIDTH * BOARD_SIZE}px` }}> {/*wrapper */}
        {boardDivs()}
        {pieces().map((piece) => {
          return (
            <Piece i={piece.i} j={piece.j} WIDTH={WIDTH} HEIGHT={HEIGHT} piece={piece.piece}
              onMouseDown={() => handleMouseDown(piece.i, piece.j, piece.piece, pieces, setDraggingPiece, setDragPos)} />
          )
        })}
      </div>
    </MetaProvider>
  );
}