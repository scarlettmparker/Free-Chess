import { colors } from "../../consts/board";
import { maskPawnAttacks, setPawnState } from "../pawn";
import { KingState, KnightState, PawnState, RookState } from "../statetype";
import { maskKnightAttacks, setKnightState } from "../knight";
import { maskKingAttacks, setKingState } from "../king";
import { bishopMask, bishopState, maskBishopAttacks, maskBishopAttacksOTF, setBishopMask, setBishopState } from "../bishop";
import { maskRookAttacks, maskRookAttacksOTF, rookMask, rookState, setRookMask, setRookState } from "../rook";
import { countBits } from "../../utils/board/bitboard";
import { setOccupancyBits } from "../../utils/occupancies";
import { bishopMagicNumbers, rookMagicNumbers } from "../../consts/magic";
import { bishopBitMask, bishopRelevantBits, rookBitMask, rookRelevantBits } from "../../consts/bits";

/**
 * Initializes attacks for both sides for leaper pieces.
 */
const initLeaperAttacks = () => {
    // pawn state
    const newPawnState: PawnState = [
        new BigUint64Array(64),
        new BigUint64Array(64)
    ];

    // knight state
    const newKnightState: KnightState = new BigUint64Array(64);

    // king state
    const newKingState: KingState = new BigUint64Array(64);

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

/**
 * Initializes attacks for slider pieces.
 * @param bishop Bishop (1) or Rook (0).
 */
export const initSliderAttacks = (bishop: number) => {
    const newBishopMask = bishopMask();
    const newRookMask = rookMask();

    const newBishopState = bishopState();
    const newRookState = rookState();
    
    for (let square = 0; square < 64; square++) {
        newBishopMask[square] = maskBishopAttacks(square);
        newRookMask[square] = maskRookAttacks(square);

        const attackMask = bishop ? newBishopMask[square] : newRookMask[square];
        const relevantBitsCount = countBits(attackMask);

        const occupancyIndicies = (1 << relevantBitsCount);

        for (let idx = 0; idx < occupancyIndicies; idx++) {
            if (bishop) {
                let occupancy = setOccupancyBits(idx, relevantBitsCount, attackMask);
                const magicIdxBig = (occupancy * bishopMagicNumbers[square]) >> (64n - BigInt(bishopRelevantBits[square]));
                const magicIdx = Number(magicIdxBig & bishopBitMask);
                newBishopState[square][magicIdx] = maskBishopAttacksOTF(square, occupancy);
            }
            // rook
            else {
                let occupancy = setOccupancyBits(idx, relevantBitsCount, attackMask);
                const magicIdxBig = (occupancy * rookMagicNumbers[square]) >> (64n - BigInt(rookRelevantBits[square]));
                const magicIdx = Number(magicIdxBig & rookBitMask); 
                newRookState[square][Number(magicIdx)] = maskRookAttacksOTF(square, occupancy);
            }
        }
    }

    if (bishop) {
        setBishopState(newBishopState);
        setBishopMask(newBishopMask);
    } else {
        setRookState(newRookState);
        setRookMask(newRookMask);
    }
}

export default initLeaperAttacks;