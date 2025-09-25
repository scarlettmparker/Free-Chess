import { Accessor, createSignal, createMemo, createEffect } from 'solid-js';
import { JSX } from 'solid-js/jsx-runtime';
import {
  WIDTH,
  HEIGHT,
  BOARD_SIZE,
  DARK,
  LIGHT,
  DARK_HOVER_HIGHLIGHTED,
  LIGHT_HOVER_HIGHLIGHTED,
  DARK_HIGHLIGHTED,
  LIGHT_HIGHLIGHTED,
  DARK_SELECTED,
  LIGHT_SELECTED,
} from '../game/consts/board';
import { MoveList } from '../game/move/movedef';
import { movesToSquares } from '../utils';

type SquareProps = Omit<JSX.HTMLAttributes<HTMLDivElement>, 'key'> & {
  /**
   * Key (used for styling).
   */
  key: number;

  /**
   * Pieces.
   */
  children: JSX.Element | JSX.Element[];

  /**
   * List of available moves.
   */
  moves: Accessor<MoveList>;

  /**
   * Setter for available moves to make.
   */
  setMoves: (moves: MoveList) => void;
};

/**
 * An individual square.
 */
const Square = (props: SquareProps) => {
  const { key, children, moves, setMoves, ...rest } = props;
  const [bgStyle, setBgStyle] = createSignal<string | null>(null);

  const squareWidth = `${WIDTH}px`;
  const squareHeight = `${HEIGHT}px`;

  // Find which square we're on
  const row = Math.floor(key / BOARD_SIZE);
  const col = key % BOARD_SIZE;
  const isDark = (row + col) % 2 === 0;

  // default background styles
  const defaultBgStyle = isDark ? DARK : LIGHT;
  const defaultHoverStyle = isDark ? DARK_HOVER_HIGHLIGHTED : LIGHT_HOVER_HIGHLIGHTED;

  // Convert moves to {source, target} squares
  const squareMoves = createMemo(() => movesToSquares(moves()));

  createEffect(() => {
    if (squareMoves().some((m) => m.target === key)) {
      setBgStyle(isDark ? DARK_HIGHLIGHTED : LIGHT_HIGHLIGHTED);
    } else if (squareMoves().some((m) => m.source === key)) {
      setBgStyle(isDark ? DARK_SELECTED : LIGHT_SELECTED);
    } else {
      // Reset to default style when not a source or target
      setBgStyle(`${defaultBgStyle} ${defaultHoverStyle}`);
    }
  });

  return (
    <div
      class={`${bgStyle()} ${rest.class ?? ''}`}
      style={{ width: squareWidth, height: squareHeight }}
      {...rest}
    >
      {children}
    </div>
  );
};

export default Square;
