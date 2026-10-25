import { useCallback, useEffect, useMemo, useState } from 'react';
import { colors, gameState, moveType, type PlayerColor } from '~/game/consts/board';
import { makeMove } from '~/game/move/move';
import { getMoveTarget } from '~/game/move/move-def';
import { playMoveSound, preloadPieceSounds } from '~/game/sound/play';
import { mountGame } from '~/utils';
import { resetGameState } from '~/game/init/game';
import { setStoredSession } from '~/utils/connect';
import {
  deserializeGameState,
  serializeGameState,
  type SerializedGameState,
} from '~/utils/game-serialize';
import { buildBoardView, emptyBoardView } from '~/utils/game-view';
import { useMatchmakingSocket } from './use-matchmaking-socket';

/**
 * Owns the engine singleton and exposes an immutable board view plus actions.
 */
export function useChessSession() {
  const [playerColor, setPlayerColor] = useState<PlayerColor | null>(null);
  const [selectedSquare, setSelectedSquare] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [version, setVersion] = useState(0);
  const [history, setHistory] = useState<SerializedGameState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const refresh = useCallback(() => setVersion((value) => value + 1), []);

  const rebuildHistory = useCallback(
    (initial: SerializedGameState | undefined, moves: number[]) => {
      if (initial) {
        Object.assign(gameState, deserializeGameState(initial));
      } else {
        mountGame();
      }
      const snapshots = [serializeGameState(gameState)];
      for (const move of moves) {
        if (makeMove(move, moveType.ALL_MOVES, 0)) {
          gameState.moveHistory.push(move);
          snapshots.push(serializeGameState(gameState));
        }
      }
      setHistory(snapshots);
      setHistoryIndex(snapshots.length - 1);
    },
    [],
  );

  const handleState = useCallback(
    (state: SerializedGameState, initial?: SerializedGameState) => {
      rebuildHistory(initial, state.moveHistory ?? []);
      setSelectedSquare(null);
      refresh();
    },
    [rebuildHistory, refresh],
  );

  /**
   * Applies an opponent move and appends it to the viewed history.
   *
   * @param move Encoded move from the opponent.
   */
  const handleOpponentMove = useCallback(
    (move: number) => {
      if (makeMove(move, moveType.ALL_MOVES, 0)) {
        gameState.moveHistory.push(move);
        setHistory((previous) => [...previous, serializeGameState(gameState)]);
        setHistoryIndex((previous) => previous + 1);
      }
      playMoveSound(move);
      setSelectedSquare(null);
      refresh();
    },
    [refresh],
  );

  const { status, sendMove } = useMatchmakingSocket({
    onSession(msg) {
      if (msg.sessionId) setStoredSession(msg.sessionId);
      if (msg.color === 'white') setPlayerColor(colors.WHITE);
      else if (msg.color === 'black') setPlayerColor(colors.BLACK);
      else setPlayerColor(null);
    },
    onState: handleState,
    onOpponentMove: handleOpponentMove,
  });

  useEffect(() => {
    mountGame();
    setHistory([serializeGameState(gameState)]);
    setHistoryIndex(0);
    setMounted(true);
    refresh();
  }, [refresh]);

  useEffect(() => {
    const preload = () => preloadPieceSounds(0);
    window.addEventListener('pointerdown', preload, { once: true });
    return () => window.removeEventListener('pointerdown', preload);
  }, []);

  const view = useMemo(
    () => (mounted ? buildBoardView(selectedSquare, playerColor, historyIndex) : emptyBoardView(playerColor)),
    [mounted, selectedSquare, playerColor, version, historyIndex],
  );

  /**
   * Selects or plays a square.
   *
   * @param key Square index.
   */
  const selectSquare = useCallback(
    (key: number) => {
      if (!mounted || !view.canMove) return;
      const square = view.squares[key];

      if (selectedSquare != null) {
        const move = view.squares[selectedSquare].moves.moves.find(
          (candidate) => getMoveTarget(candidate) === key,
        );
        if (move !== undefined && makeMove(move, moveType.ALL_MOVES, 0)) {
          gameState.moveHistory.push(move);
          setHistory((previous) => {
            const base =
              historyIndex < previous.length - 1
                ? previous.slice(0, historyIndex + 1)
                : previous;
            return [...base, serializeGameState(gameState)];
          });
          setHistoryIndex(historyIndex < history.length - 1 ? historyIndex + 1 : history.length);
          setSelectedSquare(null);
          sendMove(move);
          playMoveSound(move);
          refresh();
          return;
        }
      }

      setSelectedSquare(square.selectable ? key : null);
    },
    [mounted, view, selectedSquare, sendMove, refresh, history, historyIndex],
  );

  /**
   * Moves to the previous historical position.
   */
  const goBack = useCallback(() => {
    if (historyIndex <= 0) return;
    const move = gameState.moveHistory[historyIndex - 1];
    resetGameState();
    Object.assign(gameState, deserializeGameState(history[historyIndex - 1]));
    setHistoryIndex(historyIndex - 1);
    setSelectedSquare(null);
    if (move !== undefined) playMoveSound(move);
    refresh();
  }, [history, historyIndex, refresh]);

  /**
   * Moves to the next historical position.
   */
  const goForward = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    const move = gameState.moveHistory[historyIndex];
    resetGameState();
    Object.assign(gameState, deserializeGameState(history[historyIndex + 1]));
    setHistoryIndex(historyIndex + 1);
    setSelectedSquare(null);
    if (move !== undefined) playMoveSound(move);
    refresh();
  }, [history, historyIndex, refresh]);

  /**
   * Jumps to the most recent position.
   */
  const goLatest = useCallback(() => {
    if (historyIndex === history.length - 1) return;
    const move = gameState.moveHistory[history.length - 2];
    resetGameState();
    Object.assign(gameState, deserializeGameState(history[history.length - 1]));
    setHistoryIndex(history.length - 1);
    setSelectedSquare(null);
    if (move !== undefined) playMoveSound(move);
    refresh();
  }, [history, historyIndex, refresh]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.tagName === 'SELECT' ||
        target?.isContentEditable
      ) {
        return;
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goBack();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        goForward();
      } else if (event.key === ' ') {
        event.preventDefault();
        goLatest();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goBack, goForward, goLatest]);

  return { view, status, playerColor, selectSquare };
}
