import { Colors } from "~/routes";

const initialPieces: Record<string, string> = {
    '0,0': 'R', '0,1': 'N', '0,2': 'B', '0,3': 'Q', '0,4': 'K', '0,5': 'B', '0,6': 'N', '0,7': 'R', // white pieces
    '1,0': 'P', '1,1': 'P', '1,2': 'P', '1,3': 'P', '1,4': 'P', '1,5': 'P', '1,6': 'P', '1,7': 'P', // white pawns
    '6,0': 'p', '6,1': 'p', '6,2': 'p', '6,3': 'p', '6,4': 'p', '6,5': 'p', '6,6': 'p', '6,7': 'p', // black pawns
    '7,0': 'r', '7,1': 'n', '7,2': 'b', '7,3': 'q', '7,4': 'k', '7,5': 'b', '7,6': 'n', '7,7': 'r', // black pieces
};

export const WIDTH = 64;
export const HEIGHT = 64;
export const BOARD_SIZE = 8;

export const colors: Colors = Object.freeze({
    WHITE: 0,
    BLACK: 1
})

export default initialPieces;