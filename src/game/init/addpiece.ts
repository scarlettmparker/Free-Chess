import { gameState } from "../consts/board";
import { BalloonPiece } from "../piece/balloonpiece";
import { Bishop } from "../piece/bishop";
import { King } from "../piece/king";
import { Knight } from "../piece/knight";
import { Pawn } from "../piece/pawn";
import { PogoPiece } from "../piece/pogopiece";
import { Queen } from "../piece/queen";
import { Rook } from "../piece/rook";

/**
 * Helper functions to add a piece to the current game state (assumes black and white have same rules).
 */
export const addPawn = () => {
    const whitePiece = new Pawn(0, 0);
    const blackPiece = new Pawn(1, 1);

    gameState.pieces.push(whitePiece);
    gameState.pieces.push(blackPiece);
}

export const addKnight = () => {
    const whitePiece = new Knight(2, 0);
    const blackPiece = new Knight(3, 1);

    gameState.pieces.push(whitePiece);
    gameState.pieces.push(blackPiece);
}

export const addBishop = () => {
    const whitePiece = new Bishop(4, 0);
    const blackPiece = new Bishop(5, 1);

    gameState.pieces.push(whitePiece);
    gameState.pieces.push(blackPiece);
}

export const addRook = () => {
    const whitePiece = new Rook(6, 0);
    const blackPiece = new Rook(7, 1);

    gameState.pieces.push(whitePiece);
    gameState.pieces.push(blackPiece);
}

export const addQueen = () => {
    const whitePiece = new Queen(8, 0);
    const blackPiece = new Queen(9, 1);

    gameState.pieces.push(whitePiece);
    gameState.pieces.push(blackPiece);
}

export const addKing = () => {
    const whitePiece = new King(10, 0);
    const blackPiece = new King(11, 1);

    gameState.pieces.push(whitePiece);
    gameState.pieces.push(blackPiece);
}

export const addPogoPiece = () => {
    const whitePiece = new PogoPiece(12, 0);
    const blackPiece = new PogoPiece(13, 1);

    gameState.pieces.push(whitePiece);
    gameState.pieces.push(blackPiece);
}

export const addBalloonPiece = () => {
    const whitePiece = new BalloonPiece(14, 0);
    const blackPiece = new BalloonPiece(15, 1);

    gameState.pieces.push(whitePiece);
    gameState.pieces.push(blackPiece);
}