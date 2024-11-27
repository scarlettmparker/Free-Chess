import { straightRelevantBits, straightBitMask, diagonalRelevantBits, diagonalBitMask } from "../consts/bits";
import { colors, notAFile, notHFile } from "../consts/board";
import { straightMagicNumbers, diagonalMagicNumbers } from "../consts/magic";
import setBit, { countBits, printBitboard } from "../utils/board/bitboard";
import { getFileConstraint } from "../utils/board/squarehelper";
import { setOccupancyBits } from "../utils/occupancies";

export class Piece {
    id: number;
    color: number;
    move: number;

    globalEffect: boolean;
    firstMove: number;

    king: boolean;
    pawn: boolean;
    enpassant: boolean;
    promote: boolean;

    slider: boolean;
    leaper: boolean;
    rotationalMoveType: string;

    leaperOffsets: number[][][];
    straightConstraints: number[];
    diagonalConstraints: number[];

    straight: boolean;
    diagonal: boolean;

    pieceMask: BigUint64Array;
    straightPieceMask: BigUint64Array;
    diagonalPieceMask: BigUint64Array;

    slidingDiagonalPieceState: BigUint64Array[];
    slidingStraightPieceState: BigUint64Array[];

    leaperPieceState: BigUint64Array[];
    pawnPieceState: BigUint64Array[];

    constructor(id: number, color: number) {
        this.id = id;
        this.color = color;
        this.move = 0;

        this.globalEffect = false;
        this.firstMove = -1;

        // fun functional stuff to mess around with
        this.king = false
        this.pawn = false;
        this.enpassant = false;
        this.promote = false;

        this.slider = false;
        this.leaper = false;
        this.rotationalMoveType = "DEFAULT";

        this.straightConstraints = [];
        this.diagonalConstraints = [];
        this.leaperOffsets = [];

        this.straight = false;
        this.diagonal = false;

        this.pieceMask = new BigUint64Array(64);
        this.straightPieceMask = new BigUint64Array(64);
        this.diagonalPieceMask = new BigUint64Array(64);

        this.slidingDiagonalPieceState = Array.from({ length: 64 }, () => new BigUint64Array(512));
        this.slidingStraightPieceState = Array.from({ length: 64 }, () => new BigUint64Array(4096));
        this.leaperPieceState = Array.from({ length: this.leaperOffsets.length }, () => new BigUint64Array(64));
        this.pawnPieceState = Array.from({ length: 2 }, () => new BigUint64Array(64));
    }

    /**
     * Function to mask a piece's sliding straight attacks.
     * 
     * @param pos Position on the bitboard.
     * @param constraints Constraints on the number of squares the piece can slide diagonally (U, D, L, R).
     * @returns Piece occupancy bits for magic bitboard.
     */
    maskStraightAttacks = (pos: number, constraints: number[] = [8, 8, 8, 8]) => {
        let currentAttacks = 0n;

        const targetRank = Math.floor(pos / 8);
        const targetFile = pos % 8;

        const [up, down, left, right] = [
            constraints[0] ?? 8,
            constraints[1] ?? 8,
            constraints[2] ?? 8,
            constraints[3] ?? 8
        ];

        // up
        for (let rank = targetRank - 1, count = 0; rank > 0 && count < up; rank--, count++) {  // Adjusted to stop 1 square before the edge
            currentAttacks |= (1n << BigInt(rank * 8 + targetFile));
        }

        // down
        for (let rank = targetRank + 1, count = 0; rank < 7 && count < down; rank++, count++) {  // Adjusted to stop 1 square before the edge
            currentAttacks |= (1n << BigInt(rank * 8 + targetFile));
        }

        // left
        for (let file = targetFile - 1, count = 0; file > 0 && count < left; file--, count++) {  // Adjusted to stop 1 square before the edge
            currentAttacks |= (1n << BigInt(targetRank * 8 + file));
        }

        // right
        for (let file = targetFile + 1, count = 0; file < 7 && count < right; file++, count++) {  // Adjusted to stop 1 square before the edge
            currentAttacks |= (1n << BigInt(targetRank * 8 + file));
        }

        return currentAttacks;
    }

    maskStraightAttacksOTF = (pos: number, block: bigint, constraints: number[] = [8, 8, 8, 8]) => {
        let currentAttacks = 0n;

        const targetRank = Math.floor(pos / 8);
        const targetFile = pos % 8;

        const [up, down, left, right] = [
            constraints[0] ?? 8,
            constraints[1] ?? 8,
            constraints[2] ?? 8,
            constraints[3] ?? 8,
        ];

        // up
        for (let rank = targetRank - 1, count = 0; rank >= 0 && count < up; rank--, count++) {
            currentAttacks |= (1n << BigInt(rank * 8 + targetFile));
            if ((1n << BigInt(rank * 8 + targetFile) & block) != 0n) break;
        }

        // down
        for (let rank = targetRank + 1, count = 0; rank < 8 && count < down; rank++, count++) {
            currentAttacks |= (1n << BigInt(rank * 8 + targetFile));
            if ((1n << BigInt(rank * 8 + targetFile) & block) != 0n) break;
        }

        // left
        for (let file = targetFile - 1, count = 0; file >= 0 && count < left; file--, count++) {
            currentAttacks |= (1n << BigInt(targetRank * 8 + file));
            if ((1n << BigInt(targetRank * 8 + file) & block) != 0n) break;
        }

        // right
        for (let file = targetFile + 1, count = 0; file < 8 && count < right; file++, count++) {
            currentAttacks |= (1n << BigInt(targetRank * 8 + file));
            if ((1n << BigInt(targetRank * 8 + file) & block) != 0n) break;
        }

        return currentAttacks;
    }

    /**
     * Function to mask a piece's sliding diagonal attacks.
     * 
     * @param pos Position on the bitboard.
     * @param constraints Constraints on the number of squares the piece can slide diagonally (DR, UR, DL, UL).
     * @returns Piece occupancy bits for magic bitboard.
     */
    maskDiagonalAttacks = (pos: number, constraints: number[] = [8, 8, 8, 8]) => {
        let currentAttacks = 0n;

        const targetRank = Math.floor(pos / 8);
        const targetFile = pos % 8;

        const [downRight, upRight, downLeft, upLeft] = [
            constraints[0] ?? 8,
            constraints[1] ?? 8,
            constraints[2] ?? 8,
            constraints[3] ?? 8,
        ];

        // down right
        for (let rank = targetRank + 1, file = targetFile + 1, count = 0;
            rank < 7 && file < 7 && count < downRight;
            rank++, file++, count++) {
            currentAttacks |= (1n << BigInt(rank * 8 + file));
        }

        // up right
        for (let rank = targetRank - 1, file = targetFile + 1, count = 0;
            rank > 0 && file < 7 && count < upRight;
            rank--, file++, count++) {
            currentAttacks |= (1n << BigInt(rank * 8 + file));
        }

        // down left
        for (let rank = targetRank + 1, file = targetFile - 1, count = 0;
            rank < 7 && file > 0 && count < downLeft;
            rank++, file--, count++) {
            currentAttacks |= (1n << BigInt(rank * 8 + file));
        }

        // up left
        for (let rank = targetRank - 1, file = targetFile - 1, count = 0;
            rank > 0 && file > 0 && count < upLeft;
            rank--, file--, count++) {
            currentAttacks |= (1n << BigInt(rank * 8 + file));
        }

        return currentAttacks;
    }

    maskDiagonalAttacksOTF = (pos: number, block: bigint, constraints: number[] = [8, 8, 8, 8]) => {
        let currentAttacks = 0n;

        const targetRank = Math.floor(pos / 8);
        const targetFile = pos % 8;

        const [downRight, upRight, downLeft, upLeft] = [
            constraints[0] ?? 8,
            constraints[1] ?? 8,
            constraints[2] ?? 8,
            constraints[3] ?? 8,
        ];

        // down right
        for (let rank = targetRank + 1, file = targetFile + 1, count = 0;
            rank < 8 && file < 8 && count < downRight;
            rank++, file++, count++) {
            currentAttacks |= (1n << BigInt(rank * 8 + file));
            if ((1n << BigInt(rank * 8 + file) & block) !== 0n) break;
        }

        // up right
        for (let rank = targetRank - 1, file = targetFile + 1, count = 0;
            rank >= 0 && file < 8 && count < upRight;
            rank--, file++, count++) {
            currentAttacks |= (1n << BigInt(rank * 8 + file));
            if ((1n << BigInt(rank * 8 + file) & block) !== 0n) break;
        }

        // down left
        for (let rank = targetRank + 1, file = targetFile - 1, count = 0;
            rank < 8 && file >= 0 && count < downLeft;
            rank++, file--, count++) {
            currentAttacks |= (1n << BigInt(rank * 8 + file));
            if ((1n << BigInt(rank * 8 + file) & block) !== 0n) break;
        }

        // up left
        for (let rank = targetRank - 1, file = targetFile - 1, count = 0;
            rank >= 0 && file >= 0 && count < upLeft;
            rank--, file--, count++) {
            currentAttacks |= (1n << BigInt(rank * 8 + file));
            if ((1n << BigInt(rank * 8 + file) & block) !== 0n) break;
        }

        return currentAttacks;
    }

    /**
     * Function to mask a piece's leaper attacks.
     * 
     * @param pos Position on the bitboard.
     * @param offsets Offset values from the piece's position to determine leaping moves.
     * @returns Attack bitboard for a leaper piece on a specified square;
     */
    maskLeaperAttacks = (pos: number, offsets: number[][]) => {
        let currentAttacks = 0n;
        let currentBitboard = 0n;
        currentBitboard = setBit(currentBitboard, pos, true);

        for (const [fileOffset, rankOffset] of offsets) {
            const shift = BigInt(rankOffset * 8 - fileOffset);
            const fileConstraint = getFileConstraint(fileOffset);

            if (shift > 0n) {
                // for positive shifts (rightward)
                if ((currentBitboard >> shift & fileConstraint) !== 0n) {
                    const shiftedBitboard = currentBitboard >> shift;
                    currentAttacks |= shiftedBitboard & fileConstraint;
                }
            } else {
                // for negative shifts (leftward)
                if ((currentBitboard << -shift & fileConstraint) !== 0n) {
                    const shiftedBitboard = currentBitboard << -shift;
                    currentAttacks |= shiftedBitboard & fileConstraint;
                }
            }
        }

        return currentAttacks;
    };

    /**
     *
     */
    maskPawnAttacks = (color: number, pos: number) => {
        let currentAttacks = 0n;
        let currentBitboard = 0n;
        currentBitboard = setBit(currentBitboard, pos, true);

        // white pawns
        if (this.pawn && color == 0) {
            if ((currentBitboard >> 7n & notAFile) !== 0n) currentAttacks |= (currentBitboard >> 7n);
            if ((currentBitboard >> 9n & notHFile) !== 0n) currentAttacks |= (currentBitboard >> 9n);
            // black pawns
        } else if (this.pawn && color == 1) {
            if ((currentBitboard << 7n & notHFile) !== 0n) currentAttacks |= (currentBitboard << 7n);
            if ((currentBitboard << 9n & notAFile) !== 0n) currentAttacks |= (currentBitboard << 9n);
        }

        return currentAttacks;
    }

    /**
     * Function to return a sliding piece's attacks.
     * 
     * @param pos Position on the bitboard.
     * @param occupancy Current occupancy of the board
     * @returns A bitboard representing squares attacked by the piece.
     */
    getSlidingPieceAttacks = (pos: number, occupancy: bigint) => {
        let pieceState = 0n;

        let straightOccupancy = occupancy;
        let diagonalOccupancy = occupancy;

        let maskedStraightOccupancy;
        let maskedDiagonalOccupancy;

        // rook-like moves
        if (this.straight) {
            straightOccupancy &= this.straightPieceMask[pos];
            straightOccupancy = (straightOccupancy * straightMagicNumbers[pos]) >> (64n - BigInt(straightRelevantBits[pos]));

            // mask occupancies with bit mask due to data types
            maskedStraightOccupancy = straightOccupancy & straightBitMask;
            pieceState |= this.getSlidingStraightPieceState()[pos][Number(maskedStraightOccupancy)];
        }

        // bishop-like moves
        if (this.diagonal) {
            diagonalOccupancy &= this.diagonalPieceMask[pos];
            diagonalOccupancy = (diagonalOccupancy * diagonalMagicNumbers[pos]) >> (64n - BigInt(diagonalRelevantBits[pos]));

            maskedDiagonalOccupancy = diagonalOccupancy & diagonalBitMask;
            pieceState |= this.getSlidingDiagonalPieceState()[pos][Number(maskedDiagonalOccupancy)];
        }

        return pieceState;
    }

    /**
     * Function that initializes piece attacks for sliding pieces.
     */
    initSlidingAttacks = () => {
        const straightPieceMask = this.getStraightPieceMask();
        const diagonalPieceMask = this.getDiagonalPieceMask();

        const straightPieceState = this.getSlidingStraightPieceState();
        const diagonalPieceState = this.getSlidingDiagonalPieceState();

        for (let square = 0; square < 64; square++) {
            let relevantBitsCount;
            let occupancyIndicies;

            if (this.straight) {
                straightPieceMask[square] = this.maskStraightAttacks(square, this.straightConstraints);
                relevantBitsCount = countBits(straightPieceMask[square]);

                occupancyIndicies = 1 << relevantBitsCount;
                for (let idx = 0; idx < occupancyIndicies; idx++) {
                    let occupancy = setOccupancyBits(idx, relevantBitsCount, straightPieceMask[square]);
                    const magicIdx = (occupancy * straightMagicNumbers[square]) >> (64n - BigInt(straightRelevantBits[square]));
                    const maskedMagicIdx = Number(magicIdx & straightBitMask);
                    straightPieceState[square][maskedMagicIdx] = this.maskStraightAttacksOTF(square, occupancy, this.straightConstraints);
                }
            }

            if (this.diagonal) {
                diagonalPieceMask[square] = this.maskDiagonalAttacks(square, this.diagonalConstraints);
                relevantBitsCount = countBits(diagonalPieceMask[square]);

                occupancyIndicies = 1 << relevantBitsCount;
                for (let idx = 0; idx < occupancyIndicies; idx++) {
                    let occupancy = setOccupancyBits(idx, relevantBitsCount, diagonalPieceMask[square]);
                    const magicIdx = (occupancy * diagonalMagicNumbers[square]) >> (64n - BigInt(diagonalRelevantBits[square]));
                    const maskedMagicIdx = Number(magicIdx & diagonalBitMask);
                    diagonalPieceState[square][maskedMagicIdx] = this.maskDiagonalAttacksOTF(square, occupancy, this.diagonalConstraints);
                }
            }
        }

        if (this.straight) {
            this.setSlidingStraightPieceState(straightPieceState);
            this.setStraightPieceMask(straightPieceMask);
        }
        if (this.diagonal) {
            this.setSlidingDiagonalPieceState(diagonalPieceState);
            this.setDiagonalPieceMask(diagonalPieceMask);
        }
    }

    /**
     * Function that initializes piece attacks for leaper pieces.
     */
    initLeaperAttacks = () => {
        const pieceState = Array.from({ length: this.leaperOffsets.length }, () => new BigUint64Array(64));

        for (let i = 0; i < this.leaperOffsets.length; i++) {
            for (let square = 0; square < 64; square++) {
                pieceState[i][square] = this.maskLeaperAttacks(square, this.leaperOffsets[i]);
            }
        }

        this.setLeaperPieceState(pieceState);
    }

    /**
     * Function that initializes piece attacks for pawn pieces.
     */
    initPawnAttacks = () => {
        const pieceState = this.getPawnPieceState();

        for (let square = 0; square < 64; square++) {
            pieceState[colors.WHITE][square] = this.maskPawnAttacks(colors.WHITE, square);
            pieceState[colors.BLACK][square] = this.maskPawnAttacks(colors.BLACK, square);
        }

        this.setPawnPieceState(pieceState);
    }

    initAttacks = () => {
        if (this.slider) this.initSlidingAttacks();
        if (this.leaper) this.initLeaperAttacks();
        if (this.pawn) this.initPawnAttacks();
    }

    // getters
    getID = () => {
        return this.id;
    }

    getColor = () => {
        return this.color;
    }

    getMove = () => {
        return this.move;
    }

    getKing = () => {
        return this.king;
    }

    getPawn = () => {
        return this.pawn;
    }

    getEnpassant = () => {
        return this.enpassant;
    }

    getPromote = () => {
        return this.promote;
    }

    getSlider = () => {
        return this.slider;
    }

    getLeaper = () => {
        return this.leaper;
    }

    getRotationalMoveType = () => {
        return this.rotationalMoveType;
    }

    getPieceMask = () => {
        return this.pieceMask;
    }

    getStraightPieceMask = () => {
        return this.straightPieceMask;
    }

    getDiagonalPieceMask = () => {
        return this.diagonalPieceMask;
    }

    getSlidingStraightPieceState = () => {
        return this.slidingStraightPieceState;
    }

    getSlidingDiagonalPieceState = () => {
        return this.slidingDiagonalPieceState;
    }

    getLeaperPieceState = () => {
        return this.leaperPieceState;
    }

    getLeaperPieceStateMove = (move: number) => {
        return this.leaperPieceState[move];
    }

    getPawnPieceState = () => {
        return this.pawnPieceState;
    }

    // setters
    setMove = (move: number) => {
        this.move = move;
    }

    setKing = (king: boolean) => {
        this.king = king;
    }

    setPawn = (pawn: boolean) => {
        this.pawn = pawn;
    }

    setEnpassant = (enpassant: boolean) => {
        this.enpassant = enpassant;
    }

    setPromote = (promote: boolean) => {
        this.promote = promote;
    }

    setSlider = (slider: boolean) => {
        this.slider = slider;
    }

    setLeaper = (leaper: boolean) => {
        this.leaper = leaper;
    }

    setRotationalMoveType = (rotationalMoveType: string) => {
        this.rotationalMoveType = rotationalMoveType;
    }

    setLeaperOffsets = (leaperOffsets: number[][][]) => {
        this.leaperOffsets = leaperOffsets;
    }

    setStraightConstraints = (straightConstraints: number[]) => {
        this.straightConstraints = straightConstraints;
    }

    setDiagonalConstraints = (diagonalConstraints: number[]) => {
        this.diagonalConstraints = diagonalConstraints;
    }

    setStraight = (straight: boolean) => {
        this.straight = straight;
    }

    setDiagonal = (diagonal: boolean) => {
        this.diagonal = diagonal;
    }

    setPieceMask = (pieceMask: BigUint64Array) => {
        this.pieceMask = pieceMask;
    }

    setStraightPieceMask = (pieceMask: BigUint64Array) => {
        this.straightPieceMask = pieceMask;
    }

    setDiagonalPieceMask = (pieceMask: BigUint64Array) => {
        this.diagonalPieceMask = pieceMask;
    }

    setSlidingStraightPieceState = (pieceState: BigUint64Array[]) => {
        this.slidingStraightPieceState = pieceState;
    }

    setSlidingDiagonalPieceState = (pieceState: BigUint64Array[]) => {
        this.slidingDiagonalPieceState = pieceState;
    }

    setLeaperPieceState = (pieceState: BigUint64Array[]) => {
        this.leaperPieceState = pieceState;
    }

    setPawnPieceState = (pieceState: BigUint64Array[]) => {
        this.pawnPieceState = pieceState;
    }
}