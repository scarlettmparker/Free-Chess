import { colors } from "~/consts/board";
import { maskPawnAttacks, setPawnState } from "../pawn";
import { rawPosToNot } from "~/utils/squarehelper";
import { KingState, KnightState, PawnState } from "../statetype";
import { maskKnightAttacks, setKnightState } from "../knight";
import { maskKingAttacks, setKingState } from "../king";

/**
 * Initializes attacks for both sides for various pieces.
 */
const initLeaperAttacks = () => {
    // pawn state
    const newPawnState: PawnState = [
        Array(64).fill(BigInt(0)),
        Array(64).fill(BigInt(0))
    ];

    // knight state
    const newKnightState: KnightState = Array(64).fill(BigInt(0));

    // king state
    const newKingState: KingState = Array(64).fill(BigInt(0));

    for (let square = 0; square < 64; square++) {
        // pawn
        newPawnState[colors.WHITE][square] = maskPawnAttacks(colors.WHITE, rawPosToNot(square));
        newPawnState[colors.BLACK][square] = maskPawnAttacks(colors.BLACK, rawPosToNot(square));

        // knight
        newKnightState[square] = maskKnightAttacks(rawPosToNot(square));

        // king
        newKingState[square] = maskKingAttacks(rawPosToNot(square));
    }

    setPawnState(newPawnState);
    setKnightState(newKnightState);
    setKingState(newKingState);
}

export default initLeaperAttacks;