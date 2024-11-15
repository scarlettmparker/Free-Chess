import { MetaProvider, Title } from "@solidjs/meta";
import { createEffect, createSignal, onMount } from "solid-js";

// helpers
import initLeaperAttacks, { initSliderAttacks } from "~/pieces/init";
import board, { sliders, BigIntSignalArray, colors } from "~/consts/board";
import { printBitboard, printBoard } from "~/utils/board/bitboard";
import { bitboards, castle, enpassant, occupancies, parseFEN, side } from "~/utils/fen";
import { getter } from "~/utils/bigint";

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
const emptyBoard = "8/8/8/8/8/8/8/8 w - - ";
const startPosition = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1 ";
const trickyPosition = "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1 ";
const killerPosition = "rnbqkb1r/pp1p1pPp/8/2p1pP2/1P1P4/3P3P/P1P1P3/RNBQKBNR w KQkq e6 0 1";
const cmkPosition = "r2q1rk1/ppp2ppp/2n1bn2/2b1p3/3pP3/3P1NPP/PPP1NPB1/R1BQ1RK1 b - - 0 9 ";

export default function Home() {
  // initialization stuff
  onMount(() => {
    initAll();
    
    parseFEN(startPosition);
    printBoard(bitboards, side(), enpassant(), castle());
    printBitboard(getter(occupancies, colors.BOTH)());
  })

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