/**
 * @fileoverview Move payload validation and server-side game state rules.
 * @module server/rules
 */

import { isSquareAttacked } from '~/game/board/attacks.ts';
import { getBit } from '~/game/board/bitboard.ts';
import { lsbIndex } from '~/game/board/bb.ts';
import { gameState, getBitboard } from '~/game/consts/board.ts';
import { generateMoves } from '~/game/move/legal-move-generator.ts';
import { isLegalMove } from '~/game/move/move.ts';
import {
  getMoveCapture,
  getMovePiece,
  getMoveSource,
  getMoveTarget,
  type MoveList,
} from '~/game/move/move-def.ts';
import { pieceRegistry } from '~/game/piece/piece-registry.ts';
import { serializeGameState } from '~/utils/game-serialize.ts';

/**
 * Largest value produced by `encodeMove`.
 */
const MAX_ENCODED_MOVE = 0xffffffff;

/**
 * Draw counters owned by one game.
 */
export type GameStatusTracker = {
  /**
   * Consecutive half-moves without a pawn move or capture.
   */
  halfmoveClock: number;
  /**
   * Number of times each position has appeared.
   */
  positionCounts: Map<string, number>;
};

/**
 * Draw counters used by the legacy global game.
 */
const defaultTracker: GameStatusTracker = {
  halfmoveClock: 0,
  positionCounts: new Map(),
};

/**
 * Creates draw counters for one game.
 *
 * @returns Empty status tracker.
 */
export function createGameStatusTracker(): GameStatusTracker {
  return { halfmoveClock: 0, positionCounts: new Map() };
}

/**
 * Checks whether a value is an encoded 32-bit move.
 *
 * @param value Candidate payload field.
 * @returns True when the value can be passed to `makeMove`.
 */
export function isEncodedMove(value: unknown): value is number {
  return (
    typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= MAX_ENCODED_MOVE
  );
}

/**
 * Whether a piece definition is a king.
 *
 * @param definitionId Piece definition id.
 * @returns True when the definition is a king.
 */
function isKingDefinition(definitionId: number): boolean {
  return pieceRegistry.getDefinition(definitionId)?.isKing === true;
}

/**
 * Finds the king piece for a colour, including custom kings.
 *
 * @param color Piece colour.
 * @returns The king piece, or undefined.
 */
export function findKing(color: number) {
  return gameState.pieces.find(
    (candidate) => candidate.getColor() === color && isKingDefinition(candidate.getDefinitionId()),
  );
}

/**
 * Recomputes the checked flags for the side to move.
 *
 * `applyMove` flips `gameState.side`, so this runs after an accepted move.
 *
 * @returns Check flags indexed by colour.
 */
export function checkedForSideToMove(): [boolean, boolean] {
  const sideToMove = gameState.side;
  const opponent = sideToMove ^ 1;
  const checked: [boolean, boolean] = [false, false];
  const kingPiece = findKing(sideToMove);
  if (!kingPiece) return checked;
  const bitboard = getBitboard(kingPiece.getId());
  const square = lsbIndex(bitboard.lo, bitboard.hi);

  if (square >= 0) {
    checked[sideToMove] = isSquareAttacked(square, opponent);
  }

  return checked;
}

/**
 * Checks whether an encoded move may be applied to the current server state.
 *
 * A move must be produced by the engine for the side to move. This prevents
 * fabricated moves, moving the wrong side's pieces and capturing a king.
 *
 * @param move Encoded move.
 * @returns True when the move matches the current legal move list.
 */
export function validateServerMove(move: number): boolean {
  const pieceId = getMovePiece(move);
  const piece = gameState.pieces.find((candidate) => candidate.getId() === pieceId);
  if (!piece || piece.getColor() !== gameState.side) return false;

  const source = getMoveSource(move);
  const sourceBoard = getBitboard(pieceId);
  if (!getBit(sourceBoard.lo, sourceBoard.hi, source)) return false;

  const target = getMoveTarget(move);
  for (const candidate of gameState.pieces) {
    if (!isKingDefinition(candidate.getDefinitionId())) continue;
    const board = getBitboard(candidate.getId());
    if (getBit(board.lo, board.hi, target)) return false;
  }

  const moves: MoveList = { moves: [], count: 0 };
  generateMoves(moves, gameState.pieces);
  for (let index = 0; index < moves.count; index += 1) {
    if (moves.moves[index] === move) return true;
  }
  return false;
}

/**
 * Reason a move cannot be accepted, or null when it can be attempted.
 *
 * @param move Encoded move.
 * @param color Colour held by the caller.
 * @returns Rejection reason, or null.
 */
export function checkServerMove(
  move: number,
  color: number,
): 'game-over' | 'not-your-turn' | 'illegal-move' | null {
  if (gameState.gameOver) return 'game-over';
  if (gameState.side !== color) return 'not-your-turn';
  if (!validateServerMove(move)) return 'illegal-move';
  return null;
}

/**
 * Checks whether the side to move has at least one legal move.
 *
 * @returns True when a legal move exists.
 */
export function hasLegalMoves(): boolean {
  const moves: MoveList = { moves: [], count: 0 };
  generateMoves(moves, gameState.pieces);
  for (let index = 0; index < moves.count; index += 1) {
    if (isLegalMove(moves.moves[index])) return true;
  }
  return false;
}

/**
 * Result for a position where the side to move has no legal moves.
 *
 * @returns Checkmate for the winner, or stalemate.
 */
function terminalResult(): 'white-checkmate' | 'black-checkmate' | 'stalemate' {
  if (!gameState.checked[gameState.side]) return 'stalemate';
  if (gameState.side === 0) return 'black-checkmate';
  return 'white-checkmate';
}

/**
 * Whether only the two kings remain on the board.
 *
 * @returns True when neither side has any other piece.
 */
function hasOnlyKings(): boolean {
  return gameState.pieces.every((piece) => {
    const board = getBitboard(piece.getId());
    if (board.lo === 0 && board.hi === 0) return true;
    return isKingDefinition(piece.getDefinitionId());
  });
}

/**
 * Stable key for the current position, used for threefold repetition.
 *
 * @returns Serialized position key.
 */
function positionKey(): string {
  const state = serializeGameState(gameState);
  return JSON.stringify({
    pieces: state.pieces.map((piece) => ({
      id: piece.id,
      definitionId: piece.definitionId,
      color: piece.color,
    })),
    bitboards: state.bitboards,
    occupancies: state.occupancies,
    side: state.side,
    castle: state.castle,
    enpassant: state.enpassant,
    whiteMoves: state.whiteMoves,
    blackMoves: state.blackMoves,
  });
}

/**
 * Resets draw counters and game-over state for a new game.
 *
 * @param tracker Status tracker to reset.
 */
export function resetGameStatus(tracker: GameStatusTracker = defaultTracker): void {
  tracker.halfmoveClock = 0;
  gameState.gameOver = false;
  gameState.result = null;
  gameState.checked = checkedForSideToMove();
  tracker.positionCounts = new Map([[positionKey(), 1]]);
}

/**
 * Recomputes check, draw and game-over state for the current position.
 *
 * @param tracker Status tracker for the game.
 */
export function evaluateGameStatus(tracker: GameStatusTracker = defaultTracker): void {
  const key = positionKey();
  const count = tracker.positionCounts.get(key) ?? 1;
  gameState.checked = checkedForSideToMove();
  gameState.gameOver = false;
  gameState.result = null;

  if (tracker.halfmoveClock >= 100 || count >= 3 || hasOnlyKings()) {
    gameState.gameOver = true;
    gameState.result = 'draw';
    return;
  }

  if (!hasLegalMoves()) {
    gameState.gameOver = true;
    gameState.result = terminalResult();
  }
}

/**
 * Updates draw counters and game-over state after a move has been applied.
 *
 * @param move Encoded move that was just applied.
 * @param tracker Status tracker for the game.
 */
export function updateGameStatus(move: number, tracker: GameStatusTracker = defaultTracker): void {
  const piece = gameState.pieces.find((candidate) => candidate.getId() === getMovePiece(move));
  if (piece?.getPawn() || getMoveCapture(move)) {
    tracker.halfmoveClock = 0;
  } else {
    tracker.halfmoveClock += 1;
  }

  const key = positionKey();
  tracker.positionCounts.set(key, (tracker.positionCounts.get(key) ?? 0) + 1);
  evaluateGameStatus(tracker);
}
