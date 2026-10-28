import { beforeEach, describe, expect, it, vi } from 'vitest';
import { existsSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { gameState } from '~/game/consts/board';
import { notToRawPos } from '~/game/board/square-helper';
import { generateMoves } from '~/game/move/legal-move-generator';
import { getMoveSource, getMoveTarget } from '~/game/move/move-def';
import { serializeGameState, type SerializedGameState } from '~/utils/game-serialize';
import { loadTestPosition, mountGame } from '~/utils';
import type { Room, RoomSocket } from '~server/rooms';

const tmpDb = path.join(os.tmpdir(), `free-chess-rooms-${process.pid}.db`);
process.env.GAME_DB_PATH = tmpDb;
if (existsSync(tmpDb)) rmSync(tmpDb);

const { createGame, getGame, listMoves } = await import('~/server/games');
const { createGameToken } = await import('~/server/game-token');
const {
  clearRooms,
  closeRoomSession,
  getRoom,
  handleRoomMessage,
  openRoomSession,
  pruneRooms,
  restoreRoomState,
  ROOM_IDLE_MS,
} = await import('~server/rooms');

const secret = 'room-test-secret';

type FakeRoomSocket = RoomSocket & {
  send: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
};

/**
 * Builds a fake room socket.
 *
 * @returns Fake socket.
 */
function makeSocket(): FakeRoomSocket {
  return {
    data: { gameId: null, accountId: null, seat: null, room: null },
    send: vi.fn(),
    close: vi.fn(),
  } as unknown as FakeRoomSocket;
}

/**
 * Reads parsed messages sent to a fake socket.
 *
 * @param ws Fake socket.
 * @returns Sent messages.
 */
function messages(ws: FakeRoomSocket): Array<Record<string, unknown>> {
  return ws.send.mock.calls.map(([raw]) => JSON.parse(String(raw)) as Record<string, unknown>);
}

/**
 * Reads the last message sent to a fake socket.
 *
 * @param ws Fake socket.
 * @returns Last sent message.
 */
function lastMessage(ws: FakeRoomSocket): Record<string, unknown> | undefined {
  const sent = messages(ws);
  return sent[sent.length - 1];
}

/**
 * Builds a standard starting position.
 *
 * @returns Serialized starting state.
 */
function standardInitial() {
  mountGame();
  return serializeGameState(gameState);
}

/**
 * Creates a game and connects both players.
 *
 * @param id Deterministic game id.
 * @param creator Creator account id.
 * @param joiner Joiner account id.
 * @returns Room and sockets.
 */
function startedGame(
  id: string,
  creator: string,
  joiner: string,
  initialState: SerializedGameState = standardInitial(),
) {
  createGame(
    {
      boardLayoutId: null,
      boardLayoutName: 'Standard',
      initialState,
      creatorAccountId: creator,
    },
    { idFactory: () => id },
  );

  const creatorWs = makeSocket();
  openRoomSession(
    creatorWs,
    id,
    createGameToken({ gameId: id, accountId: creator }, secret),
    secret,
  );
  const joinerWs = makeSocket();
  openRoomSession(joinerWs, id, createGameToken({ gameId: id, accountId: joiner }, secret), secret);

  const room = getRoom(id);
  expect(room).not.toBeNull();
  return { room: room as Room, creatorWs, joinerWs };
}

/**
 * Finds the first legal move in the current room position.
 *
 * @param room Room to inspect.
 * @returns Encoded move.
 */
function firstMove(room: Room): number {
  restoreRoomState(room.snapshot);
  const moves = { moves: [] as number[], count: 0 };
  generateMoves(moves, gameState.pieces);
  const move = moves.moves[0];
  expect(move).toBeDefined();
  return move as number;
}

/**
 * Finds the first legal move between two named squares.
 *
 * @param room Room to inspect.
 * @param from Source square name.
 * @param to Target square name.
 * @returns Encoded move.
 */
function findMove(room: Room, from: string, to: string): number {
  restoreRoomState(room.snapshot);
  const moves = { moves: [] as number[], count: 0 };
  generateMoves(moves, gameState.pieces);
  const move = moves.moves
    .slice(0, moves.count)
    .find(
      (candidate) =>
        getMoveSource(candidate) === notToRawPos[from] &&
        getMoveTarget(candidate) === notToRawPos[to],
    );
  expect(move).toBeDefined();
  return move as number;
}

/**
 * Picks the socket holding a colour.
 *
 * @param room Room to inspect.
 * @param creator Creator socket.
 * @param joiner Joiner socket.
 * @param color Colour to find.
 * @returns Matching socket.
 */
function socketForColor(
  room: Room,
  creator: string,
  creatorWs: FakeRoomSocket,
  joiner: string,
  joinerWs: FakeRoomSocket,
  color: 'white' | 'black',
): FakeRoomSocket {
  const accountId = color === 'white' ? room.whiteAccountId : room.blackAccountId;
  if (accountId === creator) return creatorWs;
  if (accountId === joiner) return joinerWs;
  throw new Error('Colour is not assigned');
}

beforeEach(() => {
  clearRooms();
});

describe('room sessions', () => {
  it('holds the creator seat until another account joins', () => {
    const id = 'ROOM001';
    const creator = 'creator-room-1';
    const joiner = 'joiner-room-1';
    createGame(
      {
        boardLayoutId: null,
        boardLayoutName: 'Standard',
        initialState: standardInitial(),
        creatorAccountId: creator,
      },
      { idFactory: () => id },
    );

    const creatorWs = makeSocket();
    openRoomSession(
      creatorWs,
      id,
      createGameToken({ gameId: id, accountId: creator }, secret),
      secret,
    );

    expect(getGame(id)?.status).toBe('waiting');
    expect(messages(creatorWs)[0]).toMatchObject({
      type: 'session',
      seat: 'creator',
      color: null,
      status: 'waiting',
    });

    const joinerWs = makeSocket();
    openRoomSession(
      joinerWs,
      id,
      createGameToken({ gameId: id, accountId: joiner }, secret),
      secret,
    );

    const game = getGame(id);
    expect(game?.status).toBe('active');
    expect([game?.whiteAccountId, game?.blackAccountId]).toContain(creator);
    expect([game?.whiteAccountId, game?.blackAccountId]).toContain(joiner);
    expect(messages(joinerWs)[0]).toMatchObject({ type: 'session', status: 'active' });
    expect(lastMessage(creatorWs)).toMatchObject({ type: 'state', status: 'active' });
  });

  it('does not let a spectator move', () => {
    const id = 'ROOM002';
    const creator = 'creator-room-2';
    const joiner = 'joiner-room-2';
    startedGame(id, creator, joiner);

    const spectatorWs = makeSocket();
    openRoomSession(
      spectatorWs,
      id,
      createGameToken({ gameId: id, accountId: 'spectator-room-2' }, secret),
      secret,
    );

    expect(messages(spectatorWs)[0]).toMatchObject({ seat: 'spectator' });

    handleRoomMessage(spectatorWs, { type: 'move', move: 1 });

    expect(messages(spectatorWs)).toContainEqual(
      expect.objectContaining({ type: 'move-rejected', reason: 'no-color' }),
    );
  });

  it('stores a move and restores it on reconnect', () => {
    const id = 'ROOM003';
    const creator = 'creator-room-3';
    const joiner = 'joiner-room-3';
    const { room, creatorWs, joinerWs } = startedGame(id, creator, joiner);
    const move = firstMove(room);
    const whiteWs = socketForColor(room, creator, creatorWs, joiner, joinerWs, 'white');
    const blackWs = socketForColor(room, creator, creatorWs, joiner, joinerWs, 'black');

    handleRoomMessage(whiteWs, { type: 'move', move });

    expect(listMoves(id)).toHaveLength(1);
    expect(getRoom(id)?.moves).toEqual([move]);
    expect(lastMessage(whiteWs)).toMatchObject({ type: 'move-accepted', move });
    expect(lastMessage(blackWs)).toMatchObject({ type: 'opponent_move', move });

    const reconnectWs = makeSocket();
    openRoomSession(
      reconnectWs,
      id,
      createGameToken({ gameId: id, accountId: room.whiteAccountId as string }, secret),
      secret,
    );
    expect(messages(reconnectWs)[0]).toMatchObject({
      type: 'session',
      color: 'white',
      seat: 'white',
      status: 'active',
    });
    expect(lastMessage(reconnectWs)).toMatchObject({
      type: 'state',
      moves: [move],
      status: 'active',
    });
  });

  it('records checkmate and finishes the game', () => {
    const id = 'ROOM007';
    const creator = 'creator-room-7';
    const joiner = 'joiner-room-7';
    loadTestPosition('rnbqkbnr/pppp1ppp/8/4p3/6P1/5P2/PPPPP2P/RNBQKBNR b KQkq g3 0 2');
    const initial = serializeGameState(gameState);
    const { room, creatorWs, joinerWs } = startedGame(id, creator, joiner, initial);
    const move = findMove(room, 'd8', 'h4');
    const blackWs = socketForColor(room, creator, creatorWs, joiner, joinerWs, 'black');

    handleRoomMessage(blackWs, { type: 'move', move });

    const game = getGame(id);
    expect(game?.status).toBe('finished');
    expect(game?.result).toBe('black-checkmate');
    expect(game?.winnerAccountId).toBe(room.blackAccountId);
    expect(getRoom(id)?.status).toBe('finished');

    handleRoomMessage(blackWs, { type: 'move', move });
    expect(messages(blackWs)).toContainEqual(
      expect.objectContaining({ type: 'move-rejected', reason: 'game-over' }),
    );
  });

  it('keeps interleaved games independent', () => {
    const gameA = startedGame('ROOM004', 'creator-room-4a', 'joiner-room-4a');
    const gameB = startedGame('ROOM005', 'creator-room-4b', 'joiner-room-4b');
    const moveA = firstMove(gameA.room);
    const moveB = firstMove(gameB.room);

    const whiteA = socketForColor(
      gameA.room,
      'creator-room-4a',
      gameA.creatorWs,
      'joiner-room-4a',
      gameA.joinerWs,
      'white',
    );
    const whiteB = socketForColor(
      gameB.room,
      'creator-room-4b',
      gameB.creatorWs,
      'joiner-room-4b',
      gameB.joinerWs,
      'white',
    );

    handleRoomMessage(whiteA, { type: 'move', move: moveA });
    handleRoomMessage(whiteB, { type: 'move', move: moveB });

    const roomA = getRoom('ROOM004');
    const roomB = getRoom('ROOM005');
    expect(roomA?.moves).toEqual([moveA]);
    expect(roomB?.moves).toEqual([moveB]);
    expect(roomA?.snapshot.side).toBe(1);
    expect(roomB?.snapshot.side).toBe(1);
    expect(listMoves('ROOM004')).toHaveLength(1);
    expect(listMoves('ROOM005')).toHaveLength(1);
  });

  it('drops idle rooms without connections', () => {
    const id = 'ROOM006';
    const { creatorWs, joinerWs } = startedGame(id, 'creator-room-6', 'joiner-room-6');

    closeRoomSession(creatorWs);
    closeRoomSession(joinerWs);

    expect(pruneRooms(Date.now() + ROOM_IDLE_MS + 1)).toBeGreaterThanOrEqual(1);
  });
});
