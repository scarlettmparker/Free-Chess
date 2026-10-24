import { useCallback, useEffect, useMemo, useState } from 'react';
import { colors, gameState, moveType, type PlayerColor } from '~/game/consts/board';
import { makeMove } from '~/game/move/move';
import { getMoveTarget } from '~/game/move/move-def';
import { playMoveSound, preloadPieceSounds } from '~/game/sound/play';
import { mountGame } from '~/utils';
import { setStoredSession } from '~/utils/connect';
import { deserializeGameState, type SerializedGameState } from '~/utils/game-serialize';
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

  const refresh = useCallback(() => setVersion((value) => value + 1), []);

  const handleState = useCallback(
    (state: SerializedGameState) => {
      Object.assign(gameState, deserializeGameState(state));
      setSelectedSquare(null);
      refresh();
    },
    [refresh],
  );

  const handleOpponentMove = useCallback(
    (move: number) => {
      if (makeMove(move, moveType.ALL_MOVES, 0)) {
        gameState.moveHistory.push(move);
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
    setMounted(true);
    refresh();
  }, [refresh]);

  useEffect(() => {
    const preload = () => preloadPieceSounds(0);
    window.addEventListener('pointerdown', preload, { once: true });
    return () => window.removeEventListener('pointerdown', preload);
  }, []);

  const view = useMemo(
    () => (mounted ? buildBoardView(selectedSquare, playerColor) : emptyBoardView(playerColor)),
    [mounted, selectedSquare, playerColor, version],
  );

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
          setSelectedSquare(null);
          sendMove(move);
          playMoveSound(move);
          refresh();
          return;
        }
      }

      setSelectedSquare(square.selectable ? key : null);
    },
    [mounted, view, selectedSquare, sendMove, refresh],
  );

  return { view, status, playerColor, selectSquare };
}
