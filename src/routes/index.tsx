import { MetaProvider, Title } from "@solidjs/meta";
import { Accessor, createEffect, createSignal, JSX, onMount } from "solid-js";

// helpers
import { BOARD_SIZE, colors, HEIGHT, WIDTH } from "~/consts/board";
import { notToRawPos, rawPosToNot, squareToNot } from "~/utils/squarehelper";
import { handleMouseDown, handleMouseMove, handleMouseUp } from "~/utils/mouse";

import setBit, { countBits, getBit, getLSFBIndex, printBitboard, updateBitboard } from "~/utils/board/bitboard";
import { getpState, maskPawnAttacks } from "~/pieces/pawn";
import { getkState, maskKnightAttacks } from "~/pieces/knight";

// types
import PieceType from '~/components/Piece/type';

// components
import Piece from "~/components/Piece";
import buildBoard from "~/utils/board/board";
import initLeaperAttacks from "~/pieces/leapers";
import { getkiState, maskKingAttacks } from "~/pieces/king";
import { maskBishopAttacks, maskBishopAttacksOTF } from "~/pieces/bishop";
import { maskRookAttacks, maskRookAttacksOTF } from "~/pieces/rook";
import { setOccupancyBits } from "~/utils/occupancies";

export interface Position {
  x: number;
  y: number;
}

export type Colors = {
  WHITE: number;
  BLACK: number;
};

/**
* CONSTS --------------------------------------------------------
*/
export const notAFile: bigint = 18374403900871474942n;
export const notABFile: bigint = 18229723555195321596n;
export const notHFile: bigint = 9187201950435737471n;
export const notHGFile: bigint = 4557430888798830399n;

export default function Home() {

  const [boardDivs, setBoardDivs] = createSignal<JSX.Element[]>([]);
  const [pieces, setPieces] = createSignal<PieceType[]>([]);

  // big ints
  const [bitboard, setBitboard] = createSignal<bigint>(0n);
  const [block, setBlock] = createSignal<bigint>(0n);

  // piece states
  const [draggingPiece, setDraggingPiece] = createSignal<PieceType | null>(null);
  const [dragPos, setDragPos] = createSignal<Position | null>(null);

  // initialization stuff
  onMount(() => {
    // initLeaperAttacks();
  })

  // build the board
  createEffect(() => {
    const { divs, piecesList } = buildBoard(BOARD_SIZE, WIDTH, HEIGHT, colors);
    setBoardDivs(divs);
    setPieces(piecesList);
  });

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