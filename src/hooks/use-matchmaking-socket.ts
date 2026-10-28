import { useCallback, useEffect, useRef, useState } from 'react';
import { connectToGame, setStoredSession, tryConnectFlow, type SessionMsg } from '~/utils/connect';
import { resolveWebSocketUrl } from '~/utils/ws-url';
import type { GameResult } from '~/game/consts/board';
import type { SerializedGameState } from '~/utils/game-serialize';

export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

/**
 * Short status included with a move update.
 */
export type MoveStatus = {
  /**
   * Side to move after the update.
   */
  side: number;
  /**
   * Check flags after the update.
   */
  checked: [boolean, boolean];
  /**
   * Whether the game has finished.
   */
  gameOver: boolean;
  /**
   * Final result when finished.
   */
  result: GameResult;
  /**
   * Lifecycle status when supplied by the server.
   */
  status?: string;
};

/**
 * Authoritative position delivered by the server.
 */
export type GameStateMessage = {
  /**
   * Starting position for replay.
   */
  initial: SerializedGameState;
  /**
   * Encoded moves in ply order.
   */
  moves: number[];
  /**
   * Status for the latest position.
   */
  status: MoveStatus;
  /**
   * Account holding white.
   */
  whiteAccountId?: string | null;
  /**
   * Account holding black.
   */
  blackAccountId?: string | null;
};

type ServerMessage =
  | {
      type: 'session';
      sessionId?: string;
      color?: string;
      status?: string;
      gameId?: string;
      accountId?: string;
      seat?: string;
      guestToken?: string | null;
    }
  | {
      type: 'state';
      initial?: SerializedGameState;
      moves?: number[];
      state?: SerializedGameState;
      side?: number;
      checked?: [boolean, boolean];
      gameOver?: boolean;
      result?: GameResult;
      status?: string;
      whiteAccountId?: string | null;
      blackAccountId?: string | null;
    }
  | { type: 'opponent_move'; move: number; status?: MoveStatus }
  | { type: 'move-accepted'; move: number; status?: MoveStatus }
  | { type: 'move-rejected'; reason?: string }
  | { type: 'reject'; reason?: string }
  | { type: 'error'; reason?: string }
  | { type: 'ack'; message?: string; color?: string };

type MatchmakingHandlers = {
  /**
   * Called when the server assigns a session.
   */
  onSession: (msg: SessionMsg) => void;
  /**
   * Called with the authoritative position.
   */
  onState: (message: GameStateMessage) => void;
  /**
   * Called when another player makes a move.
   */
  onOpponentMove: (move: number, status?: MoveStatus) => void;
};

/**
 * Connection options for a specific game.
 */
export type MatchmakingOptions = {
  /**
   * Game id when connecting to an account game.
   */
  gameId?: string;
  /**
   * Signed game token when connecting to an account game.
   */
  token?: string | null;
};

const RECONNECT_DELAY_MS = 2000;

/**
 * Translation key used when a rejection has no reason.
 */
const noticeFallbacks = {
  'move-rejected': 'move-rejected',
  reject: 'rejected',
  error: 'server-error',
} as const;

/**
 * Converts a server state message into the client game shape.
 *
 * @param message Server state message.
 * @returns Client game state or null.
 */
function toGameState(message: Extract<ServerMessage, { type: 'state' }>): GameStateMessage | null {
  if (!message.initial) return null;

  if (Array.isArray(message.moves)) {
    return {
      initial: message.initial,
      moves: message.moves,
      status: {
        side: typeof message.side === 'number' ? message.side : 0,
        checked: message.checked ?? [false, false],
        gameOver: Boolean(message.gameOver),
        result: message.result ?? null,
        status: message.status,
      },
      whiteAccountId: message.whiteAccountId,
      blackAccountId: message.blackAccountId,
    };
  }

  if (message.state) {
    return {
      initial: message.initial,
      moves: message.state.moveHistory ?? [],
      status: {
        side: message.state.side,
        checked: message.state.checked,
        gameOver: message.state.gameOver,
        result: message.state.result,
      },
    };
  }

  return null;
}

/**
 * Connects to the matchmaking service and keeps the connection alive.
 *
 * @param handlers Socket event handlers.
 * @param options Game connection options.
 * @returns Connection state and send function.
 */
export function useMatchmakingSocket(
  handlers: MatchmakingHandlers,
  options: MatchmakingOptions = {},
) {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [notice, setNotice] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;
  const { gameId, token } = options;

  useEffect(() => {
    if (!notice) return;
    const timeout = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(timeout);
  }, [notice]);

  useEffect(() => {
    let disposed = false;
    let retry: ReturnType<typeof setTimeout> | null = null;

    const handleMessage = (event: MessageEvent) => {
      let message: ServerMessage;
      try {
        message = JSON.parse(String(event.data)) as ServerMessage;
      } catch (error) {
        console.debug('Could not parse socket message', error);
        return;
      }

      if (message.type === 'state') {
        const state = toGameState(message);
        if (state) handlersRef.current.onState(state);
      } else if (message.type === 'opponent_move') {
        handlersRef.current.onOpponentMove(message.move, message.status);
      } else if (
        message.type === 'move-rejected' ||
        message.type === 'reject' ||
        message.type === 'error'
      ) {
        setNotice(message.reason ?? noticeFallbacks[message.type]);
      }
    };

    const connect = async () => {
      let socket: WebSocket | null = null;

      try {
        if (gameId) {
          socket = await connectToGame(resolveWebSocketUrl(), gameId, token ?? null, (msg) =>
            handlersRef.current.onSession(msg),
          );
        } else {
          socket = await tryConnectFlow(resolveWebSocketUrl(), (msg) =>
            handlersRef.current.onSession(msg),
          );
        }
      } catch (error) {
        if (disposed) return;
        setNotice(error instanceof Error ? error.message : 'rejected');
        setStatus('disconnected');
        return;
      }

      if (disposed) {
        socket?.close();
        return;
      }

      if (!socket) {
        setStatus('disconnected');
        schedule();
        return;
      }

      socketRef.current = socket;
      socket.onmessage = handleMessage;
      socket.onclose = (event) => {
        socketRef.current = null;
        if (disposed) return;
        if (event.code === 4001 || event.code === 4003) {
          if (event.code === 4003) setStoredSession(null);
          setStatus('disconnected');
          return;
        }
        if (event.code === 4000) {
          setNotice(event.reason || 'rejected');
          setStatus('disconnected');
          return;
        }
        setStatus('reconnecting');
        schedule();
      };
      setStatus('connected');
    };

    const schedule = () => {
      if (retry) return;
      retry = setTimeout(() => {
        retry = null;
        setStatus('reconnecting');
        void connect();
      }, RECONNECT_DELAY_MS);
    };

    void connect();

    return () => {
      disposed = true;
      if (retry) clearTimeout(retry);
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [gameId, token]);

  const sendMove = useCallback((move: number) => {
    const socket = socketRef.current;
    if (typeof WebSocket === 'undefined' || !socket) return;
    if (socket.readyState !== WebSocket.OPEN) return;
    setNotice(null);
    socket.send(JSON.stringify({ type: 'move', move }));
  }, []);

  return { status, notice, sendMove };
}
