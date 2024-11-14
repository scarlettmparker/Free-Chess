import { colors } from "~/consts/board";
import { maskPawnAttacks, setPawnState } from "../pawn";
import { KingState, KnightState, PawnState } from "../statetype";
import { maskKnightAttacks, setKnightState } from "../knight";
import { maskKingAttacks, setKingState } from "../king";

/**
 * Initializes attacks for both sides for various pieces.
 */
const initLeaperAttacks = () => {
    // pawn state
    const newPawnState: PawnState = [
        Array(64).fill(0n),
        Array(64).fill(0n)
    ];

    // knight state
    const newKnightState: KnightState = Array(64).fill(0n);

    // king state
    const newKingState: KingState = Array(64).fill(0n);

    for (let square = 0; square < 64; square++) {
        // pawn
        newPawnState[colors.WHITE][square] = maskPawnAttacks(colors.WHITE, square);
        newPawnState[colors.BLACK][square] = maskPawnAttacks(colors.BLACK, square);

        // knight
        newKnightState[square] = maskKnightAttacks(square);

        // king
        newKingState[square] = maskKingAttacks(square);
    }

    setPawnState(newPawnState);
    setKnightState(newKnightState);
    setKingState(newKingState);
}

export default initLeaperAttacks;