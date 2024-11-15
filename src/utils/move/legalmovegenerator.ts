import { bitboards, castle, charPieces, colors, enpassant, occupancies, pieces, side } from "~/consts/board";
import { getter, setter } from "../bigint";
import setBit, { getBit, getLSFBIndex, updateBitboard } from "../board/bitboard";
import { notToRawPos, rawPosToNot } from "../board/squarehelper";
import { getpState } from "~/pieces/pawn";
import { isSquareAttacked } from "../board/attacks";
import { getkiState } from "~/pieces/king";
import { getBishopAttacks } from "~/pieces/bishop";
import { getRookAttacks } from "~/pieces/rook";
import { getQueenAttacks } from "~/pieces/queen";

export const generateMoves = () => {
    let sourceSquare, targetSquare;
    let bitboard, attacks = 0n;

    for (let piece = charPieces.P; piece <= charPieces.k; piece++) {
        bitboard = getter(bitboards, piece)();
        const setBitboard = setter(bitboards, piece);

        if (side() == colors.WHITE) {
            if (piece == charPieces.P) {
                // loop over white pawns within bitboard
                while (bitboard > 0n) {
                    sourceSquare = getLSFBIndex(bitboard);
                    targetSquare = sourceSquare - 8;
                    if (!(targetSquare < notToRawPos("a8")) && !getBit(getter(occupancies, colors.BOTH)(), targetSquare)) {
                        // pawn promotion
                        if (sourceSquare >= notToRawPos("a7") && sourceSquare <= notToRawPos("h7")) {

                        } else {
                            if ((sourceSquare >= notToRawPos("a2") && sourceSquare <= notToRawPos("h2")
                                && !getBit(getter(occupancies, colors.BOTH)(), targetSquare - 8))) {

                            }
                        }
                    }

                    // initialize pawn attacks bitboard
                    attacks = getpState(side(), sourceSquare) & getter(occupancies, colors.BLACK)();
                    while (attacks) {
                        targetSquare = getLSFBIndex(attacks);
                        // pawn capture promotion
                        if (sourceSquare >= notToRawPos("a7") && sourceSquare <= notToRawPos("h7")) {

                        } else {

                        }
                        attacks &= attacks - 1n;
                    }

                    // generate en passant captures
                    if (enpassant() != -1) {
                        const enpassantAttacks = getpState(side(), sourceSquare) & (1n << BigInt(enpassant()));
                        if (enpassantAttacks) {
                            let targetEnpassant = getLSFBIndex(enpassantAttacks);
                        }
                    }
                    bitboard &= bitboard - 1n;
                }
            }

            // castling moves
            if (piece == charPieces.K) {
                if (castle() & BigInt(pieces.wk)) {
                    if (!getBit(getter(occupancies, colors.BOTH)(), notToRawPos("f1"))
                        && !getBit(getter(occupancies, colors.BOTH)(), notToRawPos("g1"))) {
                        if (!isSquareAttacked(notToRawPos("e1"), colors.BLACK) && !isSquareAttacked(notToRawPos("g1"), colors.BLACK)) {
                            // can castle

                        }
                    }
                }

                // queen side
                if (castle() && BigInt(pieces.wq)) {
                    if (!getBit(getter(occupancies, colors.BOTH)(), notToRawPos("d1"))
                        && !getBit(getter(occupancies, colors.BOTH)(), notToRawPos("c1"))
                        && !getBit(getter(occupancies, colors.BOTH)(), notToRawPos("b1"))) {
                        if (!isSquareAttacked(notToRawPos("e1"), colors.BLACK) && !isSquareAttacked(notToRawPos("d1"), colors.BLACK)) {
                            // can castle
                        }
                    }
                }
            }
        } else {
            if (piece == charPieces.p) {
                // loop over white pawns within bitboard
                while (bitboard > 0n) {
                    sourceSquare = getLSFBIndex(bitboard);
                    targetSquare = sourceSquare + 8;
                    if (!(targetSquare > notToRawPos("h1")) && !getBit(getter(occupancies, colors.BOTH)(), targetSquare)) {
                        // pawn promotion
                        if (sourceSquare >= notToRawPos("a2") && sourceSquare <= notToRawPos("h2")) {

                        } else {
                            if ((sourceSquare >= notToRawPos("a7") && sourceSquare <= notToRawPos("h7")
                                && !getBit(getter(occupancies, colors.BOTH)(), targetSquare + 8))) {

                            }
                        }
                    }

                    // initialize pawn attacks bitboard
                    attacks = getpState(side(), sourceSquare) & getter(occupancies, colors.WHITE)();
                    while (attacks) {
                        targetSquare = getLSFBIndex(attacks);
                        // pawn capture promotion
                        if (sourceSquare >= notToRawPos("a2") && sourceSquare <= notToRawPos("h2")) {

                        } else {

                        }
                        attacks &= attacks - 1n;
                    }

                    // generate en passant captures
                    if (enpassant() != -1) {
                        const enpassantAttacks = getpState(side(), sourceSquare) & (1n << BigInt(enpassant()));
                        if (enpassantAttacks) {
                            let targetEnpassant = getLSFBIndex(enpassantAttacks);
                        }
                    }
                    bitboard &= bitboard - 1n;
                }
            }

            // castling moves
            if (piece == charPieces.k) {
                if (castle() & BigInt(pieces.bk)) {
                    if (!getBit(getter(occupancies, colors.BOTH)(), notToRawPos("f8"))
                        && !getBit(getter(occupancies, colors.BOTH)(), notToRawPos("g8"))) {
                        if (!isSquareAttacked(notToRawPos("e8"), colors.WHITE) && !isSquareAttacked(notToRawPos("f8"), colors.WHITE)) {
                            // can castle

                        }
                    }
                }

                // queen side
                if (castle() && BigInt(pieces.bq)) {
                    if (!getBit(getter(occupancies, colors.BOTH)(), notToRawPos("d8"))
                        && !getBit(getter(occupancies, colors.BOTH)(), notToRawPos("c8"))
                        && !getBit(getter(occupancies, colors.BOTH)(), notToRawPos("b8"))) {
                        if (!isSquareAttacked(notToRawPos("e8"), colors.WHITE) && !isSquareAttacked(notToRawPos("d8"), colors.WHITE)) {
                            // can castle
                        }
                    }
                }
            }
        }

        // generate knight moves
        if ((side() == colors.WHITE) ? piece == charPieces.N : piece == charPieces.n) {
            while (bitboard) {
                sourceSquare = getLSFBIndex(bitboard);
                attacks = getkiState(sourceSquare) & ((side() == colors.WHITE)
                    ? ~getter(occupancies, colors.WHITE)() : ~getter(occupancies, colors.BLACK)());

                while (attacks) {
                    targetSquare = getLSFBIndex(attacks);

                    // quiet move
                    if (!getBit(((side() == colors.WHITE) ? getter(occupancies, colors.BLACK)() : getter(occupancies,colors.WHITE)()), targetSquare)) {
                        
                    } else {
                        
                    }
                    attacks &= attacks - 1n;
                }
                bitboard &= bitboard - 1n;
            }
        }

        // generate bishop moves
        if ((side() == colors.WHITE) ? piece == charPieces.B : piece == charPieces.b) {
            while (bitboard) {
                sourceSquare = getLSFBIndex(bitboard);
                attacks = getBishopAttacks(sourceSquare, getter(occupancies, colors.BOTH)()) & ((side() == colors.WHITE)
                    ? ~getter(occupancies, colors.WHITE)() : ~getter(occupancies, colors.BLACK)());

                while (attacks) {
                    targetSquare = getLSFBIndex(attacks);

                    // quiet move
                    if (!getBit(((side() == colors.WHITE) ? getter(occupancies, colors.BLACK)() : getter(occupancies,colors.WHITE)()), targetSquare)) {
                        
                    } else {
                        
                    }
                    attacks &= attacks - 1n;
                }
                bitboard &= bitboard - 1n;
            }
        }

        // generate rook moves
        if ((side() == colors.WHITE) ? piece == charPieces.R : piece == charPieces.r) {
            while (bitboard) {
                sourceSquare = getLSFBIndex(bitboard);
                attacks = getRookAttacks(sourceSquare, getter(occupancies, colors.BOTH)()) & ((side() == colors.WHITE)
                    ? ~getter(occupancies, colors.WHITE)() : ~getter(occupancies, colors.BLACK)());

                while (attacks) {
                    targetSquare = getLSFBIndex(attacks);

                    // quiet move
                    if (!getBit(((side() == colors.WHITE) ? getter(occupancies, colors.BLACK)() : getter(occupancies,colors.WHITE)()), targetSquare)) {
                        
                    } else {
                        
                    }
                    attacks &= attacks - 1n;
                }
                bitboard &= bitboard - 1n;
            }
        }

        // generate queen moves
        if ((side() == colors.WHITE) ? piece == charPieces.Q : piece == charPieces.q) {
            while (bitboard) {
                sourceSquare = getLSFBIndex(bitboard);
                attacks = getQueenAttacks(sourceSquare, getter(occupancies, colors.BOTH)()) & ((side() == colors.WHITE)
                    ? ~getter(occupancies, colors.WHITE)() : ~getter(occupancies, colors.BLACK)());

                while (attacks) {
                    targetSquare = getLSFBIndex(attacks);

                    // quiet move
                    if (!getBit(((side() == colors.WHITE) ? getter(occupancies, colors.BLACK)() : getter(occupancies,colors.WHITE)()), targetSquare)) {
                        
                    } else {
                        
                    }
                    attacks &= attacks - 1n;
                }
                bitboard &= bitboard - 1n;
            }
        }

        // generate king moves
        if ((side() == colors.WHITE) ? piece == charPieces.K : piece == charPieces.k) {
            while (bitboard) {
                sourceSquare = getLSFBIndex(bitboard);
                attacks = getkiState(sourceSquare) & ((side() == colors.WHITE)
                    ? ~getter(occupancies, colors.WHITE)() : ~getter(occupancies, colors.BLACK)());

                while (attacks) {
                    targetSquare = getLSFBIndex(attacks);

                    // quiet move
                    if (!getBit(((side() == colors.WHITE) ? getter(occupancies, colors.BLACK)() : getter(occupancies,colors.WHITE)()), targetSquare)) {
                        
                    } else {
                        
                    }
                    attacks &= attacks - 1n;
                }
                bitboard &= bitboard - 1n;
            }
        }
        setBitboard(bitboard);
    }
}