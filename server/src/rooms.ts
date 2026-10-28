import { gameState, moveType } from '~/game/consts/board.ts';
import { makeMove } from '~/game/move/move.ts';
import {
  checkServerMove,
  createGameStatusTracker,
  isEncodedMove,
  resetGameStatus,
  updateGameStatus,
  type GameStatusTracker,
} from './rules.ts';
import {
  deserializeGameState,
  serializeGameState,
  type SerializedGameState,
} from '~/utils/game-serialize.ts';
import {
  assignSeat,
  finishGame,
  getGame,
  listMoves,
  recordMove,
  type GameColor,
  type GameDto,
  type GameOutcome,
  type GameStatus,
} from '~/server/games';
import { verifyGameToken } from '~/server/game-token';

/**
 * Seat held by a room connection.
 */
export type RoomSeat = GameColor | 'creator' | 'spectator';

/**
 * Socket shape used by the room layer.
 */
export type RoomSocket = {
  /**
   * Connection data.
   */
  data: {
    /**
     * Game id supplied by the client.
     */
    gameId: string | null;
    /**
     * Account proven by the signed token.
     */
    accountId: string | null;
    /**
     * Seat held by the connection.
     */
    seat: RoomSeat | null;
    /**
     * Cached room.
     */
    room: Room | null;
  };
  /**
   * Sends a JSON string to the client.
   */
  send(data: string): unknown;
  /**
   * Closes the connection.
   */
  close(code?: number, reason?: string): void;
};

/**
 * One socket attached to a room.
 */
type RoomConnection = {
  /**
   * Live socket.
   */
  ws: RoomSocket;
  /**
   * Account proven by the signed token.
   */
  accountId: string | null;
};

/**
 * One active or cached game room.
 */
export type Room = {
  /**
   * Game id.
   */
  gameId: string;
  /**
   * Starting position sent to clients.
   */
  initial: SerializedGameState;
  /**
   * Current engine snapshot.
   */
  snapshot: SerializedGameState;
  /**
   * Accepted moves in ply order.
   */
  moves: number[];
  /**
   * Draw counters for this game.
   */
  tracker: GameStatusTracker;
  /**
   * Lifecycle state.
   */
  status: GameStatus;
  /**
   * Final result when finished.
   */
  result: GameOutcome | null;
  /**
   * Account that created the game.
   */
  creatorAccountId: string;
  /**
   * Account holding white.
   */
  whiteAccountId: string | null;
  /**
   * Account holding black.
   */
  blackAccountId: string | null;
  /**
   * Connected sockets.
   */
  connections: Map<object, RoomConnection>;
  /**
   * Last activity timestamp.
   */
  lastActiveAt: number;
};

/**
 * How long a disconnected room stays cached.
 */
export const ROOM_IDLE_MS = 30 * 60 * 1000;

/**
 * Cached rooms keyed by game id.
 */
const rooms: Map<string, Room> = new Map();

/**
 * Sends a JSON message without throwing when the socket is gone.
 *
 * @param ws Socket to send to.
 * @param message Value to send.
 */
function safeSend(ws: RoomSocket, message: unknown) {
  try {
    ws.send(JSON.stringify(message));
  } catch (error) {
    console.debug('Room socket send failed', error);
  }
}

/**
 * Rejects a room connection and closes the socket.
 *
 * @param ws Socket to reject.
 * @param reason Machine-readable reason.
 */
function rejectRoom(ws: RoomSocket, reason: string) {
  safeSend(ws, { type: 'reject', reason });
  ws.close(4000, reason);
}

/**
 * Replaces the global engine state with a stored snapshot.
 *
 * @param snapshot Position to restore.
 */
export function restoreRoomState(snapshot: SerializedGameState) {
  gameState.pieces = [];
  Object.assign(gameState, deserializeGameState(snapshot));
}

/**
 * Copies a status tracker so a failed move can restore it.
 *
 * @param tracker Tracker to copy.
 * @returns Independent tracker copy.
 */
function cloneTracker(tracker: GameStatusTracker): GameStatusTracker {
  return {
    halfmoveClock: tracker.halfmoveClock,
    positionCounts: new Map(tracker.positionCounts),
  };
}

/**
 * Builds a room by replaying stored moves from the starting position.
 *
 * @param game Stored game.
 * @returns Loaded room.
 */
export function loadRoom(game: GameDto): Room {
  const tracker = createGameStatusTracker();
  restoreRoomState(game.initialState);
  resetGameStatus(tracker);

  const moves = listMoves(game.id).map((entry) => entry.move);
  for (const move of moves) {
    if (makeMove(move, moveType.ALL_MOVES, 0) !== 1) {
      throw new Error(`Stored move could not be replayed for game ${game.id}`);
    }
    gameState.moveHistory.push(move);
    updateGameStatus(move, tracker);
  }

  return {
    gameId: game.id,
    initial: game.initialState,
    snapshot: serializeGameState(gameState),
    moves,
    tracker,
    status: game.status,
    result: game.result,
    creatorAccountId: game.creatorAccountId,
    whiteAccountId: game.whiteAccountId,
    blackAccountId: game.blackAccountId,
    connections: new Map(),
    lastActiveAt: Date.now(),
  };
}

/**
 * Reads a cached room or loads it from the database.
 *
 * @param gameId Game id.
 * @returns Room or null.
 */
export function getRoom(gameId: string): Room | null {
  const existing = rooms.get(gameId);
  if (existing) {
    existing.lastActiveAt = Date.now();
    return existing;
  }

  const game = getGame(gameId);
  if (!game) return null;

  const room = loadRoom(game);
  rooms.set(gameId, room);
  return room;
}

/**
 * Refreshes room seats and status from the database.
 *
 * @param room Room to update.
 * @param game Stored game.
 */
function syncRoom(room: Room, game: GameDto) {
  room.status = game.status;
  room.result = game.result;
  room.creatorAccountId = game.creatorAccountId;
  room.whiteAccountId = game.whiteAccountId;
  room.blackAccountId = game.blackAccountId;
}

/**
 * Resolves the seat held by an account.
 *
 * @param room Room to inspect.
 * @param accountId Account id or null.
 * @returns Seat held by the account.
 */
export function seatForAccount(room: Room, accountId: string | null): RoomSeat {
  if (!accountId) return 'spectator';
  if (room.whiteAccountId === accountId) return 'white';
  if (room.blackAccountId === accountId) return 'black';
  if (
    room.whiteAccountId === null &&
    room.blackAccountId === null &&
    room.creatorAccountId === accountId
  ) {
    return 'creator';
  }
  return 'spectator';
}

/**
 * Resolves the colour held by an account.
 *
 * @param room Room to inspect.
 * @param accountId Account id or null.
 * @returns Colour held by the account or null.
 */
function colorForAccount(room: Room, accountId: string | null): GameColor | null {
  if (!accountId) return null;
  if (room.whiteAccountId === accountId) return 'white';
  if (room.blackAccountId === accountId) return 'black';
  return null;
}

/**
 * Resolves the account holding a colour.
 *
 * @param room Room to inspect.
 * @param color Colour to resolve.
 * @returns Account id or null.
 */
function accountForColor(room: Room, color: GameColor | null): string | null {
  if (color === 'white') return room.whiteAccountId;
  if (color === 'black') return room.blackAccountId;
  return null;
}

/**
 * Resolves the winning colour from an engine result.
 *
 * @param result Engine result.
 * @returns Winning colour or null for a draw.
 */
function winnerColor(result: GameOutcome | null): GameColor | null {
  if (result === 'white-checkmate') return 'white';
  if (result === 'black-checkmate') return 'black';
  return null;
}

/**
 * Builds the session message sent to a new room connection.
 *
 * @param room Room the socket joined.
 * @param accountId Account id or null.
 * @returns Session message.
 */
function sessionMessage(room: Room, accountId: string | null) {
  const seat = seatForAccount(room, accountId);
  const color = colorForAccount(room, accountId);
  return {
    type: 'session',
    gameId: room.gameId,
    accountId,
    color,
    seat,
    status: room.status,
  };
}

/**
 * Builds the current state message for a room.
 *
 * @param room Room to serialize.
 * @returns State message.
 */
export function roomStateMessage(room: Room) {
  return {
    type: 'state',
    gameId: room.gameId,
    initial: room.initial,
    moves: [...room.moves],
    side: room.snapshot.side,
    checked: [...room.snapshot.checked],
    gameOver: room.snapshot.gameOver,
    result: room.snapshot.result,
    status: room.status,
    whiteAccountId: room.whiteAccountId,
    blackAccountId: room.blackAccountId,
  };
}

/**
 * Builds the short status sent with a move update.
 *
 * @param room Room to serialize.
 * @returns Move status.
 */
function moveStatus(room: Room) {
  return {
    side: room.snapshot.side,
    checked: [...room.snapshot.checked],
    gameOver: room.snapshot.gameOver,
    result: room.snapshot.result,
    status: room.status,
  };
}

/**
 * Sends the current room state to one socket.
 *
 * @param ws Socket to send to.
 */
export function sendRoomState(ws: RoomSocket) {
  let room = ws.data.room;
  if (!room && ws.data.gameId) {
    try {
      room = getRoom(ws.data.gameId);
    } catch (error) {
      console.error('Could not reload game room for state', error);
      return;
    }
  }
  if (!room) return;
  safeSend(ws, roomStateMessage(room));
}

/**
 * Sends the current room state to every connection.
 *
 * @param room Room to broadcast.
 * @param except Socket to skip.
 */
function broadcastRoomState(room: Room, except?: RoomSocket) {
  const message = roomStateMessage(room);
  for (const connection of room.connections.values()) {
    if (connection.ws === except) continue;
    safeSend(connection.ws, message);
  }
}

/**
 * Sends a move message to every connection except the sender.
 *
 * @param room Room to broadcast.
 * @param sender Socket that made the move.
 * @param message Move message.
 */
function broadcastMove(room: Room, sender: RoomSocket, message: unknown) {
  for (const connection of room.connections.values()) {
    if (connection.ws === sender) continue;
    safeSend(connection.ws, message);
  }
}

/**
 * Opens a game socket and binds it to a seat.
 *
 * @param ws Socket that opened.
 * @param gameId Game id.
 * @param token Signed game token if any.
 * @param secret Signing secret.
 */
export function openRoomSession(
  ws: RoomSocket,
  gameId: string,
  token: string | null,
  secret: string,
) {
  const claims = token ? verifyGameToken(token, secret, Date.now(), gameId) : null;
  if (token && !claims) {
    rejectRoom(ws, 'invalid-token');
    return;
  }

  const accountId = claims?.accountId ?? null;
  let game = getGame(gameId);
  if (!game) {
    rejectRoom(ws, 'game-not-found');
    return;
  }

  let joined = false;
  if (accountId) {
    const assignment = assignSeat(gameId, accountId);
    if (assignment.status === 'not-found') {
      rejectRoom(ws, 'game-not-found');
      return;
    }
    joined = assignment.status === 'joined';
    game = getGame(gameId);
    if (!game) {
      rejectRoom(ws, 'game-not-found');
      return;
    }
  }

  let room: Room | null;
  try {
    room = getRoom(gameId);
  } catch (error) {
    console.error('Could not load game room', error);
    rejectRoom(ws, 'server-error');
    return;
  }

  if (!room) {
    rejectRoom(ws, 'game-not-found');
    return;
  }

  syncRoom(room, game);
  room.connections.set(ws, { ws, accountId });
  room.lastActiveAt = Date.now();
  ws.data.gameId = gameId;
  ws.data.accountId = accountId;
  ws.data.seat = seatForAccount(room, accountId);
  ws.data.room = room;

  safeSend(ws, sessionMessage(room, accountId));

  if (joined) {
    broadcastRoomState(room);
  } else {
    safeSend(ws, roomStateMessage(room));
  }
}

/**
 * Applies a move sent by a room socket.
 *
 * @param ws Socket that sent the move.
 * @param message Parsed client message.
 */
export function handleRoomMessage(ws: RoomSocket, message: { type?: unknown; move?: unknown }) {
  if (message.type !== 'move') return;

  const room = ws.data.room;
  if (!room) return;

  if (!isEncodedMove(message.move)) {
    rejectRoomMove(ws, room, 'invalid-payload');
    return;
  }

  const move = message.move;
  const color = colorForAccount(room, ws.data.accountId);
  if (!color) {
    rejectRoomMove(ws, room, 'no-color');
    return;
  }

  const side = color === 'white' ? 0 : 1;
  const previousSnapshot = room.snapshot;
  const previousTracker = cloneTracker(room.tracker);

  try {
    restoreRoomState(room.snapshot);
    const rejection = checkServerMove(move, side);
    if (rejection !== null) {
      rejectRoomMove(ws, room, rejection);
      return;
    }

    if (makeMove(move, moveType.ALL_MOVES, 0) !== 1) {
      rejectRoomMove(ws, room, 'illegal-move');
      return;
    }

    gameState.moveHistory.push(move);
    updateGameStatus(move, room.tracker);
    recordMove(room.gameId, move);
    room.moves.push(move);
    room.snapshot = serializeGameState(gameState);
  } catch (error) {
    room.snapshot = previousSnapshot;
    room.tracker = previousTracker;
    console.error('Room move failed', error);
    rejectRoomMove(ws, room, 'server-error');
    return;
  }

  if (room.snapshot.gameOver && room.snapshot.result) {
    room.status = 'finished';
    room.result = room.snapshot.result;
    const winningColor = winnerColor(room.result);
    finishGame(room.gameId, room.result, accountForColor(room, winningColor));
  }

  safeSend(ws, { type: 'move-accepted', move, status: moveStatus(room) });

  if (room.status === 'finished') {
    broadcastRoomState(room);
    return;
  }

  broadcastMove(room, ws, {
    type: 'opponent_move',
    move,
    status: moveStatus(room),
  });
  room.lastActiveAt = Date.now();
}

/**
 * Rejects a room move and resends the authoritative state.
 *
 * @param ws Socket that sent the move.
 * @param room Room the socket belongs to.
 * @param reason Machine-readable reason.
 */
function rejectRoomMove(ws: RoomSocket, room: Room, reason: string) {
  safeSend(ws, { type: 'move-rejected', reason });
  safeSend(ws, roomStateMessage(room));
}

/**
 * Removes a socket from its room.
 *
 * @param ws Socket that closed.
 */
export function closeRoomSession(ws: RoomSocket) {
  const room = ws.data.room ?? (ws.data.gameId ? rooms.get(ws.data.gameId) : undefined);
  if (!room) return;
  room.connections.delete(ws);
  room.lastActiveAt = Date.now();
  ws.data.room = null;
}

/**
 * Drops cached rooms with no connections after the idle window.
 *
 * @param now Current time in milliseconds.
 * @param idleMs Idle window in milliseconds.
 * @returns Number of rooms removed.
 */
export function pruneRooms(now = Date.now(), idleMs = ROOM_IDLE_MS): number {
  let removed = 0;
  for (const [gameId, room] of rooms) {
    if (room.connections.size > 0) continue;
    if (now - room.lastActiveAt < idleMs) continue;
    rooms.delete(gameId);
    removed += 1;
  }
  return removed;
}

/**
 * Clears cached rooms for tests.
 */
export function clearRooms() {
  rooms.clear();
}
