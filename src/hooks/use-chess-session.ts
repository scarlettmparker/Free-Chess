import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { colors, gameState, type PlayerColor } from '~/game/consts/board';
import { getMovePromoted, getMoveTarget } from '~/game/move/move-def';
import { playMoveSound, preloadPieceSounds } from '~/game/sound/play';
import { mountGame } from '~/utils';
import { setStoredSession } from '~/utils/connect';
import { replayGameMoves } from '~/utils/game-replay';
import type { SerializedGameState } from '~/utils/game-serialize';
import { buildBoardView, emptyBoardView } from '~/utils/game-view';
import {
  useMatchmakingSocket,
  type GameStateMessage,
  type MoveStatus,
  type MatchmakingOptions,
} from './use-matchmaking-socket';

/**
 * Owns the engine singleton and exposes an immutable board view plus actions.
 *
 * @param options Optional game connection details.
 */
export function useChessSession(options: MatchmakingOptions = {}) {
  const [playerColor, setPlayerColor] = useState<PlayerColor | null>(null);
  const [selectedSquare, setSelectedSquare] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [version, setVersion] = useState(0);
  const [initialState, setInitialState] = useState<SerializedGameState | null>(null);
  const [moves, setMoves] = useState<number[]>([]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [latestStatus, setLatestStatus] = useState<MoveStatus | null>(null);
  const [gameStatus, setGameStatus] = useState<string | null>(null);
  const [promotion, setPromotion] = useState<number[] | null>(null);
  const accountIdRef = useRef<string | null>(null);

  const refresh = useCallback(() => setVersion((value) => value + 1), []);

  /**
   * Restores a position by replaying moves and applies latest status flags.
   *
   * @param initial Starting position.
   * @param allMoves Stored moves.
   * @param index Number of moves to apply.
   * @param status Status for the latest position.
   */
  const applyPosition = useCallback(
    (
      initial: SerializedGameState,
      allMoves: number[],
      index: number,
      status: MoveStatus | null,
    ) => {
      const applied = replayGameMoves(initial, allMoves, index);
      const atLatest = applied === allMoves.length;
      gameState.gameOver = atLatest ? Boolean(status?.gameOver) : false;
      gameState.result = atLatest ? (status?.result ?? null) : null;
      gameState.checked =
        atLatest && status ? [status.checked[0], status.checked[1]] : [false, false];
      refresh();
    },
    [refresh],
  );

  /**
   * Applies an authoritative position from the server.
   *
   * @param message Game state message.
   */
  const handleState = useCallback(
    (message: GameStateMessage) => {
      setInitialState(message.initial);
      setMoves(message.moves);
      setHistoryIndex(message.moves.length);
      setLatestStatus(message.status);
      setGameStatus(message.status.status ?? null);
      applyPosition(message.initial, message.moves, message.moves.length, message.status);
      setSelectedSquare(null);
      setPromotion(null);

      const accountId = accountIdRef.current;
      if (!accountId) return;
      if (message.whiteAccountId === accountId) {
        setPlayerColor(colors.WHITE);
      } else if (message.blackAccountId === accountId) {
        setPlayerColor(colors.BLACK);
      } else if (message.whiteAccountId !== undefined || message.blackAccountId !== undefined) {
        setPlayerColor(null);
      }
    },
    [applyPosition],
  );

  /**
   * Appends an opponent move without disturbing an earlier viewed position.
   *
   * @param move Encoded move from the opponent.
   * @param status Status after the move.
   */
  const handleOpponentMove = useCallback(
    (move: number, status?: MoveStatus) => {
      const atLatest = historyIndex >= moves.length;
      const nextMoves = [...moves, move];
      setMoves(nextMoves);
      if (status) setLatestStatus(status);
      if (atLatest && initialState) {
        setHistoryIndex(nextMoves.length);
        applyPosition(initialState, nextMoves, nextMoves.length, status ?? latestStatus);
        playMoveSound(move);
      }
      setSelectedSquare(null);
      refresh();
    },
    [applyPosition, historyIndex, initialState, latestStatus, moves, refresh],
  );

  const { status, notice, sendMove } = useMatchmakingSocket(
    {
      onSession(msg) {
        if (msg.accountId) {
          accountIdRef.current = msg.accountId;
        }
        if (!options.gameId && msg.sessionId) {
          setStoredSession(msg.sessionId);
        }
        if (msg.color === 'white') setPlayerColor(colors.WHITE);
        else if (msg.color === 'black') setPlayerColor(colors.BLACK);
        else setPlayerColor(null);
        if (options.gameId && msg.status) setGameStatus(msg.status);
      },
      onState: handleState,
      onOpponentMove: handleOpponentMove,
    },
    options,
  );

  useEffect(() => {
    mountGame();
    setMoves([]);
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
    () =>
      mounted
        ? buildBoardView(selectedSquare, playerColor, historyIndex, historyIndex === moves.length)
        : emptyBoardView(playerColor),
    [mounted, selectedSquare, playerColor, version, historyIndex, moves.length],
  );

  /**
   * Applies one move locally and sends it to the server.
   *
   * @param move Encoded move.
   */
  const playMove = useCallback(
    (move: number) => {
      if (!initialState) return;
      const nextMoves = [...moves, move];
      setMoves(nextMoves);
      setHistoryIndex(nextMoves.length);
      applyPosition(initialState, nextMoves, nextMoves.length, latestStatus);
      setSelectedSquare(null);
      sendMove(move);
      playMoveSound(move);
    },
    [applyPosition, initialState, latestStatus, moves, sendMove],
  );

  /**
   * Selects or plays a square.
   *
   * @param key Square index.
   */
  const selectSquare = useCallback(
    (key: number) => {
      if (!mounted || !view.canMove) return;
      if (historyIndex !== moves.length) return;
      const square = view.squares[key];

      if (selectedSquare != null) {
        const candidates = view.squares[selectedSquare].moves.moves.filter(
          (candidate) => getMoveTarget(candidate) === key,
        );
        const promotions = candidates.filter((candidate) => getMovePromoted(candidate) > 0);
        if (promotions.length > 1) {
          setPromotion(promotions);
          return;
        }
        const move = promotions[0] ?? candidates[0];
        if (move !== undefined) {
          playMove(move);
          return;
        }
      }

      setSelectedSquare(square.selectable ? key : null);
    },
    [mounted, view, selectedSquare, playMove, historyIndex, moves.length],
  );

  /**
   * Plays the chosen promotion move.
   *
   * @param move Encoded promotion move.
   */
  const choosePromotion = useCallback(
    (move: number) => {
      setPromotion(null);
      playMove(move);
    },
    [playMove],
  );

  /**
   * Closes the promotion picker without moving.
   */
  const cancelPromotion = useCallback(() => {
    setPromotion(null);
    setSelectedSquare(null);
  }, []);

  /**
   * Moves to the previous historical position.
   */
  const goBack = useCallback(() => {
    if (!initialState || historyIndex <= 0) return;
    const nextIndex = historyIndex - 1;
    setHistoryIndex(nextIndex);
    applyPosition(initialState, moves, nextIndex, latestStatus);
    setSelectedSquare(null);
    const move = moves[nextIndex];
    if (move !== undefined) playMoveSound(move);
  }, [applyPosition, historyIndex, initialState, latestStatus, moves]);

  /**
   * Moves to the next historical position.
   */
  const goForward = useCallback(() => {
    if (!initialState || historyIndex >= moves.length) return;
    const nextIndex = historyIndex + 1;
    setHistoryIndex(nextIndex);
    applyPosition(initialState, moves, nextIndex, latestStatus);
    setSelectedSquare(null);
    const move = moves[historyIndex];
    if (move !== undefined) playMoveSound(move);
  }, [applyPosition, historyIndex, initialState, latestStatus, moves]);

  /**
   * Jumps to the most recent position.
   */
  const goLatest = useCallback(() => {
    if (!initialState || historyIndex === moves.length) return;
    setHistoryIndex(moves.length);
    applyPosition(initialState, moves, moves.length, latestStatus);
    setSelectedSquare(null);
    const move = moves[moves.length - 1];
    if (move !== undefined) playMoveSound(move);
  }, [applyPosition, historyIndex, initialState, latestStatus, moves]);

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
    status,
    notice,
    playerColor,
    gameStatus,
    selectSquare,
    promotion,
    choosePromotion,
    cancelPromotion,
  };
}
