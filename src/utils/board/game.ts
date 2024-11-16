import { gameState } from "~/consts/board";

export function resetGameState() {
    gameState.bitboards = Array.from({ length: 12 }, () => 0n);
    gameState.occupancies = Array.from({ length: 3 }, () => 0n);
    gameState.side = 0;
    gameState.enpassant = -1;
    gameState.castle = 0n;
    gameState.nodes = 0;
    gameState.captures = 0;
    gameState.promotions = 0;
    gameState.castles = 0;
    gameState.checks = 0;
}