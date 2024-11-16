import { Accessor } from "solid-js";
import { BitboardSignal } from "~/consts/board";

// elegant solution to get and set bitboards
export const getter = (signal: Accessor<BitboardSignal[]>, index: number) => {
    return signal()[index][0];
}

export const setter = (signal: Accessor<BitboardSignal[]>, index: number) => {
    return signal()[index][1];
}

export default null;