import { bitboards, castle, charPieces, colors, enpassant, occupancies, pieces, side } from "~/consts/board";
import { getter, setter } from "../bigint";
import { getBit, getLSFBIndex, printBitboard } from "../board/bitboard";
import { notToRawPos, rawPosToNot } from "../board/squarehelper";
import { getpState } from "~/pieces/pawn";
import { isSquareAttacked } from "../board/attacks";
import { getkiState } from "~/pieces/king";
import { getBishopAttacks } from "~/pieces/bishop";
import { getRookAttacks } from "~/pieces/rook";
import { getQueenAttacks } from "~/pieces/queen";
import { encodeMove, MoveList } from "./movedef";
import { addMove } from "./move";
import { getkState } from "~/pieces/knight";

/**
 * Generate legal moves.
 * @param moves Move list to add the moves to.
 */
export const generateMoves = (moves: MoveList) => {
    let sourceSquare, targetSquare;
    let bitboard, attacks;
    moves.count = 0;

    for (let piece = charPieces.P; piece <= charPieces.k; piece++) {
        bitboard = getter(bitboards, piece)();

        if (side() == colors.WHITE) {
            if (piece == charPieces.P) {
                // loop over white pawns within bitboard
                while (bitboard > 0n) {
                    sourceSquare = getLSFBIndex(bitboard);
                    targetSquare = sourceSquare - 8;
                    if (!(targetSquare < notToRawPos("a8")) && !getBit(getter(occupancies, colors.BOTH)(), targetSquare)) {
                        if (sourceSquare >= notToRawPos("a7") && sourceSquare <= notToRawPos("h7")) {
                            // promotions
                            addMove(moves, encodeMove(sourceSquare, targetSquare, piece, charPieces.Q, 0, 0, 0, 0));
                            addMove(moves, encodeMove(sourceSquare, targetSquare, piece, charPieces.R, 0, 0, 0, 0));
                            addMove(moves, encodeMove(sourceSquare, targetSquare, piece, charPieces.B, 0, 0, 0, 0));
                            addMove(moves, encodeMove(sourceSquare, targetSquare, piece, charPieces.N, 0, 0, 0, 0));
                        } else {
                            // one square ahead push
                            addMove(moves, encodeMove(sourceSquare, targetSquare, piece, 0, 0, 0, 0, 0));
                            if ((sourceSquare >= notToRawPos("a2") && sourceSquare <= notToRawPos("h2"))
                                && !getBit(getter(occupancies, colors.BOTH)(), targetSquare - 8)) {
                                addMove(moves, encodeMove(sourceSquare, targetSquare - 8, piece, 0, 0, 1, 0, 0));
                            }
                        }
                    }

                    // initialize pawn attacks bitboard
                    attacks = getpState(side(), sourceSquare) & getter(occupancies, colors.BLACK)();
                    while (attacks > 0n) {
                        targetSquare = getLSFBIndex(attacks);
                        // pawn capture promotion
                        if (sourceSquare >= notToRawPos("a7") && sourceSquare <= notToRawPos("h7")) {
                            addMove(moves, encodeMove(sourceSquare, targetSquare, piece, charPieces.Q, 1, 0, 0, 0));
                            addMove(moves, encodeMove(sourceSquare, targetSquare, piece, charPieces.R, 1, 0, 0, 0));
                            addMove(moves, encodeMove(sourceSquare, targetSquare, piece, charPieces.B, 1, 0, 0, 0));
                            addMove(moves, encodeMove(sourceSquare, targetSquare, piece, charPieces.N, 1, 0, 0, 0));
                        } else {
                            addMove(moves, encodeMove(sourceSquare, targetSquare, piece, 0, 1, 0, 0, 0));
                        }
                        attacks &= ~(1n << BigInt(targetSquare));
                    }

                    // generate en passant captures
                    if (enpassant() != -1) {
                        const enpassantAttacks = getpState(side(), sourceSquare) & (1n << BigInt(enpassant()));
                        if (enpassantAttacks) {
                            let targetEnpassant = getLSFBIndex(enpassantAttacks);
                            addMove(moves, encodeMove(sourceSquare, targetEnpassant, piece, 0, 1, 0, 1, 0));
                        }
                    }
                    bitboard &= ~(1n << BigInt(sourceSquare));
                }
            }

            // castling moves
            if (piece == charPieces.K) {
                if (castle() & BigInt(pieces.wk)) {
                    if (!getBit(getter(occupancies, colors.BOTH)(), notToRawPos("f1"))
                        && !getBit(getter(occupancies, colors.BOTH)(), notToRawPos("g1"))) {
                        if (!isSquareAttacked(notToRawPos("e1"), colors.BLACK) && !isSquareAttacked(notToRawPos("f1"), colors.BLACK)) {
                            addMove(moves, encodeMove(notToRawPos("e1"), notToRawPos("g1"), piece, 0, 0, 0, 0, 1));
                        }
                    }
                }

                // queen side
                if (castle() && BigInt(pieces.wq)) {
                    if (!getBit(getter(occupancies, colors.BOTH)(), notToRawPos("d1")) && !getBit(getter(occupancies, colors.BOTH)(), notToRawPos("c1"))
                        && !getBit(getter(occupancies, colors.BOTH)(), notToRawPos("b1"))) {
                        if (!isSquareAttacked(notToRawPos("e1"), colors.BLACK) && !isSquareAttacked(notToRawPos("d1"), colors.BLACK)) {
                            addMove(moves, encodeMove(notToRawPos("e1"), notToRawPos("c1"), piece, 0, 0, 0, 0, 1));
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
                            addMove(moves, encodeMove(sourceSquare, targetSquare, piece, charPieces.q, 0, 0, 0, 0));
                            addMove(moves, encodeMove(sourceSquare, targetSquare, piece, charPieces.r, 0, 0, 0, 0));
                            addMove(moves, encodeMove(sourceSquare, targetSquare, piece, charPieces.b, 0, 0, 0, 0));
                            addMove(moves, encodeMove(sourceSquare, targetSquare, piece, charPieces.n, 0, 0, 0, 0));
                        } else {
                            addMove(moves, encodeMove(sourceSquare, targetSquare, piece, 0, 0, 0, 0, 0));
                            if ((sourceSquare >= notToRawPos("a7") && sourceSquare <= notToRawPos("h7")
                                && !getBit(getter(occupancies, colors.BOTH)(), targetSquare + 8))) {
                                    addMove(moves, encodeMove(sourceSquare, targetSquare + 8, piece, 0, 0, 1, 0, 0));
                            }
                        }
                    }

                    // initialize pawn attacks bitboard
                    attacks = getpState(side(), sourceSquare) & getter(occupancies, colors.WHITE)();
                    while (attacks > 0n) {
                        targetSquare = getLSFBIndex(attacks);
                        // pawn capture promotion
                        if (sourceSquare >= notToRawPos("a2") && sourceSquare <= notToRawPos("h2")) {
                            addMove(moves, encodeMove(sourceSquare, targetSquare, piece, charPieces.q, 1, 0, 0, 0));
                            addMove(moves, encodeMove(sourceSquare, targetSquare, piece, charPieces.r, 1, 0, 0, 0));
                            addMove(moves, encodeMove(sourceSquare, targetSquare, piece, charPieces.b, 1, 0, 0, 0));
                            addMove(moves, encodeMove(sourceSquare, targetSquare, piece, charPieces.n, 1, 0, 0, 0));
                        } else {
                            addMove(moves, encodeMove(sourceSquare, targetSquare, piece, 0, 1, 0, 0, 0));
                        }
                        attacks &= ~(1n << BigInt(targetSquare));
                    }

                    // generate en passant captures
                    if (enpassant() != -1) {
                        const enpassantAttacks = getpState(side(), sourceSquare) & (1n << BigInt(enpassant()));
                        if (enpassantAttacks) {
                            let targetEnpassant = getLSFBIndex(enpassantAttacks);
                            addMove(moves, encodeMove(sourceSquare, targetEnpassant, piece, 0, 1, 0, 1, 0));
                        }
                    }
                    bitboard &= ~(1n << BigInt(sourceSquare));
                }
            }

            // castling moves
            if (piece == charPieces.k) {
                if (castle() & BigInt(pieces.bk)) {
                    if (!getBit(getter(occupancies, colors.BOTH)(), notToRawPos("f8"))
                        && !getBit(getter(occupancies, colors.BOTH)(), notToRawPos("g8"))) {
                        if (!isSquareAttacked(notToRawPos("e8"), colors.WHITE) && !isSquareAttacked(notToRawPos("f8"), colors.WHITE)) {
                            addMove(moves, encodeMove(notToRawPos("e8"), notToRawPos("g8"), piece, 0, 0, 0, 0, 1));
                        }
                    }
                }

                // queen side
                if (castle() && BigInt(pieces.bq)) {
                    if (!getBit(getter(occupancies, colors.BOTH)(), notToRawPos("d8"))
                        && !getBit(getter(occupancies, colors.BOTH)(), notToRawPos("c8"))
                        && !getBit(getter(occupancies, colors.BOTH)(), notToRawPos("b8"))) {
                        if (!isSquareAttacked(notToRawPos("e8"), colors.WHITE) && !isSquareAttacked(notToRawPos("d8"), colors.WHITE)) {
                            addMove(moves, encodeMove(notToRawPos("e8"), notToRawPos("c8"), piece, 0, 0, 0, 0, 1));
                        }
                    }
                }
            }
        }

        // generate knight moves
        if ((side() == colors.WHITE) ? piece == charPieces.N : piece == charPieces.n) {
            while (bitboard > 0n) {
                sourceSquare = getLSFBIndex(bitboard);
                attacks = getkState(sourceSquare) & ((side() == colors.WHITE)
                    ? ~getter(occupancies, colors.WHITE)() : ~getter(occupancies, colors.BLACK)());

                while (attacks > 0n) {
                    targetSquare = getLSFBIndex(attacks);

                    // quiet move
                    if (!getBit(((side() == colors.WHITE) ? getter(occupancies, colors.BLACK)() : getter(occupancies, colors.WHITE)()), targetSquare)) {
                        addMove(moves, encodeMove(sourceSquare, targetSquare, piece, 0, 0, 0, 0, 0));
                    } else {
                        addMove(moves, encodeMove(sourceSquare, targetSquare, piece, 0, 1, 0, 0, 0));
                    }
                    attacks &= ~(1n << BigInt(targetSquare));
                }
                bitboard &= ~(1n << BigInt(sourceSquare));
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
                    if (!getBit(((side() == colors.WHITE) ? getter(occupancies, colors.BLACK)() : getter(occupancies, colors.WHITE)()), targetSquare)) {
                        addMove(moves, encodeMove(sourceSquare, targetSquare, piece, 0, 0, 0, 0, 0));
                    } else {
                        addMove(moves, encodeMove(sourceSquare, targetSquare, piece, 0, 1, 0, 0, 0));
                    }
                    attacks &= ~(1n << BigInt(targetSquare));
                }
                bitboard &= ~(1n << BigInt(sourceSquare));
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
                    if (!getBit(((side() == colors.WHITE) ? getter(occupancies, colors.BLACK)() : getter(occupancies, colors.WHITE)()), targetSquare)) {
                        addMove(moves, encodeMove(sourceSquare, targetSquare, piece, 0, 0, 0, 0, 0));
                    } else {
                        addMove(moves, encodeMove(sourceSquare, targetSquare, piece, 0, 1, 0, 0, 0));
                    }
                    attacks &= ~(1n << BigInt(targetSquare));
                }
                bitboard &= ~(1n << BigInt(sourceSquare));
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
                    if (!getBit(((side() == colors.WHITE) ? getter(occupancies, colors.BLACK)() : getter(occupancies, colors.WHITE)()), targetSquare)) {
                        addMove(moves, encodeMove(sourceSquare, targetSquare, piece, 0, 0, 0, 0, 0));
                    } else {
                        addMove(moves, encodeMove(sourceSquare, targetSquare, piece, 0, 1, 0, 0, 0));
                    }
                    attacks &= ~(1n << BigInt(targetSquare));
                }
                bitboard &= ~(1n << BigInt(sourceSquare));
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
                    if (!getBit(((side() == colors.WHITE) ? getter(occupancies, colors.BLACK)() : getter(occupancies, colors.WHITE)()), targetSquare)) {
                        addMove(moves, encodeMove(sourceSquare, targetSquare, piece, 0, 0, 0, 0, 0));
                    } else {
                        addMove(moves, encodeMove(sourceSquare, targetSquare, piece, 0, 1, 0, 0, 0));
                    }
                    attacks &= ~(1n << BigInt(targetSquare));
                }
                bitboard &= ~(1n << BigInt(sourceSquare));
            }
        }
    }

    return moves;
}