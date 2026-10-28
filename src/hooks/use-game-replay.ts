import { useCallback, useEffect, useMemo, useState } from 'react';
import { gameState, type GameResult } from '~/game/consts/board';
import { replayGameMoves } from '~/utils/game-replay';
import type { SerializedGameState } from '~/utils/game-serialize';
import { buildBoardView, emptyBoardView } from '~/utils/game-view';

/**
 * Replay inputs for one stored game.
 */
export type GameReplayOptions = {
  /**
   * Starting position.
   */
  initialState: SerializedGameState;
  /**
   * Encoded moves in ply order.
   */
  moves: number[];
  /**
   * Final result when the game has finished.
   */
  result: GameResult;
};

/**
 * Replays a stored game with arrow key navigation.
 *
 * @param options Replay inputs.
 * @returns Board view and navigation actions.
 */
export function useGameReplay(options: GameReplayOptions) {
  const { initialState, moves, result } = options;
  const [historyIndex, setHistoryIndex] = useState(moves.length);
  const [version, setVersion] = useState(0);
  const [mounted, setMounted] = useState(false);

  const refresh = useCallback(() => setVersion((value) => value + 1), []);

  const applyPosition = useCallback(
    (index: number) => {
      replayGameMoves(initialState, moves, index);
      const atLatest = index === moves.length;
      gameState.gameOver = atLatest && result !== null;
      gameState.result = atLatest ? result : null;
      gameState.checked = [false, false];
      refresh();
    },
    [initialState, moves, refresh, result],
  );

  useEffect(() => {
    setHistoryIndex(moves.length);
    replayGameMoves(initialState, moves, moves.length);
    gameState.gameOver = result !== null;
    gameState.result = result;
    gameState.checked = [false, false];
    setMounted(true);
    refresh();
  }, [initialState, moves.length, refresh, result]);

  const view = useMemo(
    () =>
      mounted
        ? buildBoardView(null, null, historyIndex, historyIndex === moves.length)
        : emptyBoardView(null),
    [mounted, version, historyIndex, moves.length],
  );

  /**
   * Moves to the previous historical position.
   */
  const goBack = useCallback(() => {
    if (historyIndex <= 0) return;
    const nextIndex = historyIndex - 1;
    setHistoryIndex(nextIndex);
    applyPosition(nextIndex);
  }, [applyPosition, historyIndex]);

  /**
   * Moves to the next historical position.
   */
  const goForward = useCallback(() => {
    if (historyIndex >= moves.length) return;
    const nextIndex = historyIndex + 1;
    setHistoryIndex(nextIndex);
    applyPosition(nextIndex);
  }, [applyPosition, historyIndex, moves.length]);

  /**
   * Jumps to the most recent position.
   */
  const goLatest = useCallback(() => {
    if (historyIndex === moves.length) return;
    setHistoryIndex(moves.length);
    applyPosition(moves.length);
  }, [applyPosition, historyIndex, moves.length]);

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

  return {
    view,
    historyIndex,
    moveCount: moves.length,
    goBack,
    goForward,
    goLatest,
  };
}
