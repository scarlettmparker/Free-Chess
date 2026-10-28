import type { ServerWebSocket } from 'bun';
import { colors, gameState } from '~/game/consts/board';
import { notToRawPos } from '~/game/board/square-helper';
import { generateMoves } from '~/game/move/legal-move-generator';
import { encodeMove, getMoveSource, getMoveTarget } from '~/game/move/move-def';
import { loadTestPosition } from '~/utils';
import { colorMap, createSession, sessions } from '~server/sessions';
import { handleMessage, type SocketData } from '~server/socket';
import { resetGameStatus } from '~server/rules';
import { DEFAULT_MESSAGE_RATE_LIMIT } from '~server/ws-rate-limit';

const startPosition = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

type FakeSocket = ServerWebSocket<SocketData> & {
  data: SocketData;
  send: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
};

/**
 * Build a fake websocket for handler tests.
 *
 * @param data Socket data overrides.
 * @returns Fake socket.
 */
function fakeSocket(data: Partial<SocketData> = {}): FakeSocket {
  return {
    data: {
      sessionId: null,
      clientColor: null,
      requestedColor: null,
      gameId: null,
      token: null,
      accountId: null,
      seat: null,
      room: null,
      ...data,
    },
    send: vi.fn(),
    close: vi.fn(),
  } as unknown as FakeSocket;
}

/**
 * Find a generated move between two squares.
 *
 * @param from Source square name.
 * @param to Target square name.
 * @returns Encoded move, or undefined.
 */
function findMove(from: string, to: string): number | undefined {
  const moves = { moves: [] as number[], count: 0 };
  generateMoves(moves, gameState.pieces);
  return moves.moves
    .slice(0, moves.count)
    .find(
      (move) =>
        getMoveSource(move) === notToRawPos[from] && getMoveTarget(move) === notToRawPos[to],
    );
}

/**
 * Attach a fake socket to a session with a colour.
 *
 * @param color Session colour.
 * @param ws Fake socket.
 * @returns Session id.
 */
function attach(color: 'white' | 'black', ws: FakeSocket): string {
  const session = createSession(color, ws);
  ws.data.sessionId = session.sessionId;
  ws.data.clientColor = color;
  return session.sessionId;
}

describe('websocket message handler', () => {
  beforeEach(() => {
    sessions.clear();
    colorMap.clear();
    loadTestPosition(startPosition);
    resetGameStatus();
  });

  test('accepts a legal move and broadcasts state', () => {
    const ws = fakeSocket();
    attach('white', ws);
    const move = findMove('e2', 'e4');

    expect(move).toBeDefined();
    handleMessage(ws, JSON.stringify({ type: 'move', move }));

    expect(gameState.side).toBe(colors.BLACK);
    expect(ws.send).toHaveBeenCalledWith(expect.stringContaining('"type":"state"'));
  });

  test('rejects a move the engine did not generate', () => {
    const ws = fakeSocket();
    attach('white', ws);
    const move = encodeMove(notToRawPos['e2'], notToRawPos['e5'], 0, 0, 0, 0, 0, 0);

    handleMessage(ws, JSON.stringify({ type: 'move', move }));

    expect(gameState.side).toBe(colors.WHITE);
    expect(ws.send).toHaveBeenCalledWith(expect.stringContaining('"type":"move-rejected"'));
  });

  test('rejects a spectator claiming a colour after the game starts', () => {
    createSession('white');
    createSession('black');
    const ws = fakeSocket();
    const session = createSession(null, ws);
    ws.data.sessionId = session.sessionId;
    gameState.moveHistory.push(1);

    handleMessage(ws, JSON.stringify({ type: 'hello', color: 'white' }));

    expect(ws.close).toHaveBeenCalledWith(4000, 'game-started');
    expect(ws.send).toHaveBeenCalledWith(expect.stringContaining('"reason":"game-started"'));
  });

  test('allows a colour claim before the game starts', () => {
    const ws = fakeSocket();
    sessions.set('claim-session', { color: null, ws, disconnectedAt: null });
    ws.data.sessionId = 'claim-session';

    handleMessage(ws, JSON.stringify({ type: 'hello', color: 'white' }));

    expect(ws.data.clientColor).toBe('white');
    expect(colorMap.get('white')).toBe('claim-session');
    expect(ws.send).toHaveBeenCalledWith(expect.stringContaining('"type":"ack"'));
  });

  test('closes a socket that exceeds the message rate limit', () => {
    const ws = fakeSocket();
    for (let index = 0; index < DEFAULT_MESSAGE_RATE_LIMIT.capacity; index += 1) {
      handleMessage(ws, '{}');
    }

    handleMessage(ws, '{}');

    expect(ws.close).toHaveBeenCalledWith(4008, 'rate-limited');
    expect(ws.send).toHaveBeenCalledWith(expect.stringContaining('"reason":"rate-limited"'));
  });

  test('reports an engine failure without throwing', () => {
    const ws = fakeSocket();
    attach('white', ws);
    const piece = gameState.pieces.find(
      (candidate) => candidate.getColor() === colors.WHITE && candidate.getType() === 'pawn',
    )!;
    piece.setDefinitionId(9999);
    piece.setType('unknown-piece');
    const move = encodeMove(notToRawPos['e2'], notToRawPos['e4'], piece.getId(), 0, 0, 0, 0, 0);

    expect(() => handleMessage(ws, JSON.stringify({ type: 'move', move }))).not.toThrow();
    expect(ws.send).toHaveBeenCalledWith(expect.stringContaining('"reason":"server-error"'));
  });
});
