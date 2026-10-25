import { isSquareAttacked } from '~/game/board/attacks';
import { notToRawPos } from '~/game/board/square-helper';
import { gameState } from '~/game/consts/board';
import { LeaperMoveBehavior } from '~/game/piece/piece';
import type { PieceDefinition } from '~/game/piece/piece-definition';
import { mountGame } from '~/utils';
import { deserializeGameState, serializeGameState } from '~/utils/game-serialize';

describe('game state serialization', () => {
  beforeEach(() => {
    mountGame();
  });

  test('round-trips the starting position', () => {
    const first = serializeGameState(gameState);
    const restored = deserializeGameState(first);
    const second = serializeGameState(restored);

    expect(second).toEqual(first);
    expect(second.side).toBe(first.side);
    expect(second.pieces.map((piece) => piece.id)).toEqual(first.pieces.map((piece) => piece.id));
  });

  test('survives a JSON transport round-trip', () => {
    const first = serializeGameState(gameState);
    const restored = deserializeGameState(JSON.parse(JSON.stringify(first)));

    expect(serializeGameState(restored)).toEqual(first);
  });

  test('initializes generic leaper attack tables after deserialization', () => {
    const first = serializeGameState(gameState);
    const template = first.pieces.find((piece) => piece.color === 0)!;
    const definition: PieceDefinition = {
      id: 100,
      slug: 'test-leaper',
      name: 'Test Leaper',
      isKing: false,
      promotionTargets: [],
      promotionRanks: [],
      moveStates: [
        {
          index: 0,
          vectors: [{ dx: 1, dy: 1, range: 'hop', capture: 'optional' }],
        },
      ],
      stateTransition: 'none',
      edgeReset: false,
      sprite: { headKey: 'pawn-head', bodyKey: 'pawn-body', footKey: 'pawn-foot' },
    };
    const square = notToRawPos['f7'];

    first.pieces.push({
      ...template,
      id: 18,
      definitionId: definition.id,
      definition,
      color: 0,
      pieceType: definition.slug,
    });
    first.whitePieceIds.push(18);
    first.bitboards.push({ pieceId: 18, bitboard: (1n << BigInt(square)).toString() });
    first.occupancies[0] = (BigInt(first.occupancies[0]) | (1n << BigInt(square))).toString();
    first.occupancies[2] = (BigInt(first.occupancies[2]) | (1n << BigInt(square))).toString();

    Object.assign(gameState, deserializeGameState(first));
    const leaper = gameState.pieces.find((piece) => piece.getId() === 18);

    expect(leaper?.getMoveBehavior()).toBeInstanceOf(LeaperMoveBehavior);
    expect(isSquareAttacked(notToRawPos['g8'], 0)).toBe(true);
  });
});
