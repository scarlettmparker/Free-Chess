import { blackPromotions, charPieces, colors, gameState, pieces, whitePromotions } from "~/consts/board";
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
    let targetSquare: number;
    let bitboard, attacks;
    let movesCopy = moves;
    movesCopy.count = 0;

    for (let piece = charPieces.P; piece <= charPieces.k; piece++) {
        bitboard = gameState.bitboards[piece];
        let sourceSquare = getLSFBIndex(bitboard);

        if (gameState.side == colors.WHITE) {
            if (piece == charPieces.P) {
                // loop over white pawns within bitboard
                while (bitboard > 0n) {
                    sourceSquare = getLSFBIndex(bitboard);
                    targetSquare = sourceSquare - 8;
                    if (!(targetSquare < notToRawPos["a8"]) && !getBit(gameState.occupancies[colors.BOTH], targetSquare)) {
                        if (sourceSquare >= notToRawPos["a7"] && sourceSquare <= notToRawPos["h7"]) {
                            // promotions
                            whitePromotions.forEach(promotePiece => {
                                addMove(movesCopy, encodeMove(sourceSquare, targetSquare, piece, promotePiece, 0, 0, 0, 0));
                            });
                        } else {
                            // one square ahead push
                            addMove(movesCopy, encodeMove(sourceSquare, targetSquare, piece, 0, 0, 0, 0, 0));
                            if ((sourceSquare >= notToRawPos["a2"] && sourceSquare <= notToRawPos["h2"])
                                && !getBit(gameState.occupancies[colors.BOTH], targetSquare - 8)) {
                                addMove(movesCopy, encodeMove(sourceSquare, targetSquare - 8, piece, 0, 0, 1, 0, 0));
                            }
                        }
                    }

                    // initialize pawn attacks bitboard
                    attacks = getpState(gameState.side, sourceSquare) & gameState.occupancies[colors.BLACK];
                    while (attacks > 0n) {
                        targetSquare = getLSFBIndex(attacks);
                        // pawn capture promotion
                        if (sourceSquare >= notToRawPos["a7"] && sourceSquare <= notToRawPos["h7"]) {
                            whitePromotions.forEach(promotePiece => {
                                addMove(movesCopy, encodeMove(sourceSquare, targetSquare, piece, promotePiece, 1, 0, 0, 0));
                            });
                        } else {
                            addMove(movesCopy, encodeMove(sourceSquare, targetSquare, piece, 0, 1, 0, 0, 0));
                        }
                        attacks &= ~(1n << BigInt(targetSquare));
                    }

                    // generate en passant captures
                    if (gameState.enpassant != -1) {
                        const enpassantAttacks = getpState(gameState.side, sourceSquare) & (1n << BigInt(gameState.enpassant));
                        if (enpassantAttacks) {
                            let targetEnpassant = getLSFBIndex(enpassantAttacks);
                            addMove(movesCopy, encodeMove(sourceSquare, targetEnpassant, piece, 0, 1, 0, 1, 0));
                        }
                    }
                    bitboard &= ~(1n << BigInt(sourceSquare));
                }
            }

            // castling moves
            if (piece == charPieces.K) {
                if (gameState.castle & BigInt(pieces.wk)) {
                    if (!getBit(gameState.occupancies[colors.BOTH], notToRawPos["f1"])
                        && !getBit(gameState.occupancies[colors.BOTH], notToRawPos["g1"])) {
                        if (!isSquareAttacked(notToRawPos["e1"], colors.BLACK) && !isSquareAttacked(notToRawPos["f1"], colors.BLACK)) {
                            addMove(movesCopy, encodeMove(notToRawPos["e1"], notToRawPos["g1"], piece, 0, 0, 0, 0, 1));
                        }
                    }
                }

                // queen side
                if (gameState.castle & BigInt(pieces.wq)) {
                    if (!getBit(gameState.occupancies[colors.BOTH], notToRawPos["d1"]) && !getBit(gameState.occupancies[colors.BOTH], notToRawPos["c1"])
                        && !getBit(gameState.occupancies[colors.BOTH], notToRawPos["b1"])) {
                        if (!isSquareAttacked(notToRawPos["e1"], colors.BLACK) && !isSquareAttacked(notToRawPos["d1"], colors.BLACK)) {
                            addMove(movesCopy, encodeMove(notToRawPos["e1"], notToRawPos["c1"], piece, 0, 0, 0, 0, 1));
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
                    if (!(targetSquare > notToRawPos["h1"]) && !getBit(gameState.occupancies[colors.BOTH], targetSquare)) {
                        // pawn promotion
                        if (sourceSquare >= notToRawPos["a2"] && sourceSquare <= notToRawPos["h2"]) {
                            blackPromotions.forEach(promotePiece => {
                                addMove(movesCopy, encodeMove(sourceSquare, targetSquare, piece, promotePiece, 0, 0, 0, 0));
                            });
                        } else {
                            addMove(movesCopy, encodeMove(sourceSquare, targetSquare, piece, 0, 0, 0, 0, 0));
                            if ((sourceSquare >= notToRawPos["a7"] && sourceSquare <= notToRawPos["h7"]
                                && !getBit(gameState.occupancies[colors.BOTH], targetSquare + 8))) {
                                    addMove(movesCopy, encodeMove(sourceSquare, targetSquare + 8, piece, 0, 0, 1, 0, 0));
                            }
                        }
                    }

                    // initialize pawn attacks bitboard
                    attacks = getpState(gameState.side, sourceSquare) & gameState.occupancies[colors.WHITE];
                    while (attacks > 0n) {
                        targetSquare = getLSFBIndex(attacks);
                        // pawn capture promotion
                        if (sourceSquare >= notToRawPos["a2"] && sourceSquare <= notToRawPos["h2"]) {
                            blackPromotions.forEach(promotePiece => {
                                addMove(movesCopy, encodeMove(sourceSquare, targetSquare, piece, promotePiece, 1, 0, 0, 0));
                            });
                        } else {
                            addMove(movesCopy, encodeMove(sourceSquare, targetSquare, piece, 0, 1, 0, 0, 0));
                        }
                        attacks &= ~(1n << BigInt(targetSquare));
                    }

                    // generate en passant captures
                    if (gameState.enpassant != -1) {
                        const enpassantAttacks = getpState(gameState.side, sourceSquare) & (1n << BigInt(gameState.enpassant));
                        if (enpassantAttacks) {
                            let targetEnpassant = getLSFBIndex(enpassantAttacks);
                            addMove(movesCopy, encodeMove(sourceSquare, targetEnpassant, piece, 0, 1, 0, 1, 0));
                        }
                    }
                    bitboard &= ~(1n << BigInt(sourceSquare));
                }
            }

            // castling moves
            if (piece == charPieces.k) {
                if (gameState.castle & BigInt(pieces.bk)) {
                    if (!getBit(gameState.occupancies[colors.BOTH], notToRawPos["f8"])
                        && !getBit(gameState.occupancies[colors.BOTH], notToRawPos["g8"])) {
                        if (!isSquareAttacked(notToRawPos["e8"], colors.WHITE) && !isSquareAttacked(notToRawPos["f8"], colors.WHITE)) {
                            addMove(movesCopy, encodeMove(notToRawPos["e8"], notToRawPos["g8"], piece, 0, 0, 0, 0, 1));
                        }
                    }
                }

                // queen side
                if (gameState.castle & BigInt(pieces.bq)) {
                    if (!getBit(gameState.occupancies[colors.BOTH], notToRawPos["d8"])
                        && !getBit(gameState.occupancies[colors.BOTH], notToRawPos["c8"])
                        && !getBit(gameState.occupancies[colors.BOTH], notToRawPos["b8"])) {
                        if (!isSquareAttacked(notToRawPos["e8"], colors.WHITE) && !isSquareAttacked(notToRawPos["d8"], colors.WHITE)) {
                            addMove(movesCopy, encodeMove(notToRawPos["e8"], notToRawPos["c8"], piece, 0, 0, 0, 0, 1));
                        }
                    }
                }
            }
        }

        // generate knight moves
        if ((gameState.side == colors.WHITE) ? piece == charPieces.N : piece == charPieces.n) {
            while (bitboard > 0n) {
                sourceSquare = getLSFBIndex(bitboard);
                attacks = getkState(sourceSquare) & ((gameState.side == colors.WHITE)
                    ? ~gameState.occupancies[colors.WHITE] : ~gameState.occupancies[colors.BLACK]);
                    
                while (attacks > 0n) {
                    targetSquare = getLSFBIndex(attacks);
                    // quiet move
                    if (!getBit(((gameState.side == colors.WHITE) ? gameState.occupancies[colors.BLACK] : gameState.occupancies[colors.WHITE]), targetSquare)) {
                        addMove(movesCopy, encodeMove(sourceSquare, targetSquare, piece, 0, 0, 0, 0, 0));
                    } else {
                        addMove(movesCopy, encodeMove(sourceSquare, targetSquare, piece, 0, 1, 0, 0, 0));
                    }
                    attacks &= ~(1n << BigInt(targetSquare));
                }
                bitboard &= ~(1n << BigInt(sourceSquare));
            }
        }

        // generate bishop moves
        if ((gameState.side == colors.WHITE) ? piece == charPieces.B : piece == charPieces.b) {
            while (bitboard) {
                sourceSquare = getLSFBIndex(bitboard);
                attacks = getBishopAttacks(sourceSquare, gameState.occupancies[colors.BOTH]) & ((gameState.side == colors.WHITE)
                    ? ~gameState.occupancies[colors.WHITE] : ~gameState.occupancies[colors.BLACK]);

                while (attacks) {
                    targetSquare = getLSFBIndex(attacks);

                    // quiet move
                    if (!getBit(((gameState.side == colors.WHITE) ? gameState.occupancies[colors.BLACK] : gameState.occupancies[colors.WHITE]), targetSquare)) {
                        addMove(movesCopy, encodeMove(sourceSquare, targetSquare, piece, 0, 0, 0, 0, 0));
                    } else {
                        addMove(movesCopy, encodeMove(sourceSquare, targetSquare, piece, 0, 1, 0, 0, 0));
                    }
                    attacks &= ~(1n << BigInt(targetSquare));
                }
                bitboard &= ~(1n << BigInt(sourceSquare));
            }
        }

        // generate rook moves
        if ((gameState.side == colors.WHITE) ? piece == charPieces.R : piece == charPieces.r) {
            while (bitboard) {
                sourceSquare = getLSFBIndex(bitboard);
                attacks = getRookAttacks(sourceSquare, gameState.occupancies[colors.BOTH]) & ((gameState.side == colors.WHITE)
                    ? ~gameState.occupancies[colors.WHITE] : ~gameState.occupancies[colors.BLACK]);

                while (attacks) {
                    targetSquare = getLSFBIndex(attacks);

                    // quiet move
                    if (!getBit(((gameState.side == colors.WHITE) ? gameState.occupancies[colors.BLACK] : gameState.occupancies[colors.WHITE]), targetSquare)) {
                        addMove(movesCopy, encodeMove(sourceSquare, targetSquare, piece, 0, 0, 0, 0, 0));
                    } else {
                        addMove(movesCopy, encodeMove(sourceSquare, targetSquare, piece, 0, 1, 0, 0, 0));
                    }
                    attacks &= ~(1n << BigInt(targetSquare));
                }
                bitboard &= ~(1n << BigInt(sourceSquare));
            }
        }

        // generate queen moves
        if ((gameState.side == colors.WHITE) ? piece == charPieces.Q : piece == charPieces.q) {
            while (bitboard) {
                sourceSquare = getLSFBIndex(bitboard);
                attacks = getQueenAttacks(sourceSquare, gameState.occupancies[colors.BOTH]) & ((gameState.side == colors.WHITE)
                    ? ~gameState.occupancies[colors.WHITE] : ~gameState.occupancies[colors.BLACK]);

                while (attacks) {
                    targetSquare = getLSFBIndex(attacks);

                    // quiet move
                    if (!getBit(((gameState.side == colors.WHITE) ? gameState.occupancies[colors.BLACK] : gameState.occupancies[colors.WHITE]), targetSquare)) {
                        addMove(movesCopy, encodeMove(sourceSquare, targetSquare, piece, 0, 0, 0, 0, 0));
                    } else {
                        addMove(movesCopy, encodeMove(sourceSquare, targetSquare, piece, 0, 1, 0, 0, 0));
                    }
                    attacks &= ~(1n << BigInt(targetSquare));
                }
                bitboard &= ~(1n << BigInt(sourceSquare));
            }
        }

        // generate king moves
        if ((gameState.side == colors.WHITE) ? piece == charPieces.K : piece == charPieces.k) {
            while (bitboard) {
                sourceSquare = getLSFBIndex(bitboard);
                attacks = getkiState(sourceSquare) & ((gameState.side == colors.WHITE)
                    ? ~gameState.occupancies[colors.WHITE] : ~gameState.occupancies[colors.BLACK]);

                while (attacks) {
                    targetSquare = getLSFBIndex(attacks);

                    // quiet move
                    if (!getBit(((gameState.side == colors.WHITE) ? gameState.occupancies[colors.BLACK] : gameState.occupancies[colors.WHITE]), targetSquare)) {
                        addMove(movesCopy, encodeMove(sourceSquare, targetSquare, piece, 0, 0, 0, 0, 0));
                    } else {
                        addMove(movesCopy, encodeMove(sourceSquare, targetSquare, piece, 0, 1, 0, 0, 0));
                    }
                    attacks &= ~(1n << BigInt(targetSquare));
                }
                bitboard &= ~(1n << BigInt(sourceSquare));
            }
        }
    }
    return movesCopy;
}

export default null;