import { useCallback, useEffect, useRef, useState } from 'react';
import { setStoredSession, tryConnectFlow, type SessionMsg } from '~/utils/connect';
import { resolveWebSocketUrl } from '~/utils/ws-url';
import type { SerializedGameState } from '~/utils/game-serialize';

export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

type ServerMessage =
  | { type: 'session'; sessionId?: string; color?: string; status?: string }
  | { type: 'state'; state: SerializedGameState; initial?: SerializedGameState }
  | { type: 'opponent_move'; move: number }
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
   * Called with the authoritative game state.
   */
  onState: (state: SerializedGameState, initial?: SerializedGameState) => void;
  /**
   * Called when the opponent makes a move.
   */
  onOpponentMove: (move: number) => void;
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
 * Connects to the matchmaking service and keeps the connection alive.
 */
export function useMatchmakingSocket(handlers: MatchmakingHandlers) {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [notice, setNotice] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

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
      } catch {
        return;
      }

      if (message.type === 'state') {
        handlersRef.current.onState(message.state, message.initial);
      } else if (message.type === 'opponent_move') {
        handlersRef.current.onOpponentMove(message.move);
      } else if (
        message.type === 'move-rejected' ||
        message.type === 'reject' ||
        message.type === 'error'
      ) {
        setNotice(message.reason ?? noticeFallbacks[message.type]);
      }
    };

    const connect = async () => {
      const socket = await tryConnectFlow(resolveWebSocketUrl(), (msg) =>
        handlersRef.current.onSession(msg),
      );

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
  }, []);

  const sendMove = useCallback((move: number) => {
    const socket = socketRef.current;
    if (typeof WebSocket === 'undefined' || !socket) return;
    if (socket.readyState !== WebSocket.OPEN) return;
    setNotice(null);
    socket.send(JSON.stringify({ type: 'move', move }));
  }, []);

  return { status, notice, sendMove };
}
