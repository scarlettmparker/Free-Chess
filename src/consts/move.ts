import { createSignal } from "solid-js";
import { MoveList } from "~/utils/move/movedef";

export const moveType = Object.freeze({
    ALL_MOVES: 0,
    ONLY_CAPTURES: 1
});

export const [moves, setMoves] = createSignal<MoveList>({ moves: [], count: 0 });