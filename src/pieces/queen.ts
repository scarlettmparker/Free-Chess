import { bishopMagicNumbers, rookMagicNumbers } from "~/consts/magic";
import { bishopBitMask, bishopRelevantBits, rookBitMask, rookRelevantBits } from "~/consts/bits";
import { bishopMask, bishopState } from "./bishop";
import { rookMask, rookState } from "./rook";

/**
 * 
 * @param pos Position on the bitboard.
 * @param occupancy Current occupancy of the board
 * @returns A bitboard representing squares attacked by the rook.
 */
export const getQueenAttacks = (pos: number, occupancy: bigint) => {
    let queenState = 0n;

    let bishopOccupancy = occupancy;
    let rookOccupancy = occupancy;

    // bishop attacks on current occupancy
    bishopOccupancy &= bishopMask()[pos];
    bishopOccupancy = (bishopOccupancy * bishopMagicNumbers[pos]) >> (64n - BigInt(bishopRelevantBits[pos]));
    const maskedBishopOccupancy = bishopOccupancy & bishopBitMask;

    // rook attacks on current occupancy
    rookOccupancy &= rookMask()[pos];
    rookOccupancy = (rookOccupancy * rookMagicNumbers[pos]) >> (64n - BigInt(rookRelevantBits[pos]));
    const maskedRookOccupancy = rookOccupancy & rookBitMask;

    queenState |= bishopState()[pos][Number(maskedBishopOccupancy)];
    queenState |= rookState()[pos][Number(maskedRookOccupancy)];
    return queenState;
}

export default null;