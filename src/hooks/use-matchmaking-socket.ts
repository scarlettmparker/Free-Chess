import { useCallback, useEffect, useRef, useState } from 'react';
import { setStoredSession, tryConnectFlow, type SessionMsg } from '~/utils/connect';
import { resolveWebSocketUrl } from '~/utils/ws-url';
import type { SerializedGameState } from '~/utils/game-serialize';

export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

type ServerMessage =
  | { type: 'session'; sessionId?: string; color?: string; status?: string }
  | { type: 'state'; state: SerializedGameState; initial?: SerializedGameState }
  | { type: 'opponent_move'; move: number }
  | { type: 'reject'; reason?: string }
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
 * Connects to the matchmaking service and keeps the connection alive.
 */
export function useMatchmakingSocket(handlers: MatchmakingHandlers) {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const socketRef = useRef<WebSocket | null>(null);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

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
    socket.send(JSON.stringify({ type: 'move', move }));
  }, []);

  return { status, sendMove };
}
