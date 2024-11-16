import { MetaProvider, Title } from "@solidjs/meta";
import { createEffect, createSignal, onMount } from "solid-js";

// helpers
import initLeaperAttacks, { initSliderAttacks } from "~/pieces/init";
import board, { sliders, BigIntSignalArray, colors, charPieces, bitboards, castle, enpassant, side, unicodePieces, occupancies, setBitboards, setOccupancies, setSide, setEnpassant, setCastle, nodes, captures, castles, checks, promotions } from "~/consts/board";
import { printBitboard, printBoard, updateBitboard } from "~/utils/board/bitboard";
import { parseFEN } from "~/utils/fen";
import { printAttackedSquares } from "~/utils/board/attacks";
import { generateMoves } from "~/utils/move/legalmovegenerator";
import { notToRawPos, rawPosToNot } from "~/utils/board/squarehelper";
import { encodeMove, MoveList } from "~/utils/move/movedef";
import { addMove, makeMove, printMove, printMoveList } from "~/utils/move/move";
import { moveType, setMoves } from "~/consts/move";
import { getter } from "~/utils/bigint";
import { perftDriver } from "~/utils/perf";
import { takeBack } from "~/utils/board/copy";

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
  onMount(() => {
    initAll();

    parseFEN(trickyPosition);
    printBoard(bitboards, side(), enpassant(), castle());

    console.time("perft");
    perftDriver(3);
    console.timeEnd("perft");
    console.log(`nodes: ${nodes()}`);
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
    </MetaProvider>
  );
}