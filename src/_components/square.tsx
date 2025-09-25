import { Accessor, createSignal, createMemo, createEffect, splitProps } from 'solid-js';
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
};

/**
 * An individual square.
 */
const Square = (props: SquareProps) => {
  const [local, rest] = splitProps(props, ['key', 'children', 'moves']);
  const [bgStyle, setBgStyle] = createSignal<string | null>(null);

  const squareWidth = `${WIDTH}px`;
  const squareHeight = `${HEIGHT}px`;

  const row = createMemo(() => Math.floor(local.key / BOARD_SIZE));
  const col = createMemo(() => local.key % BOARD_SIZE);
  const isDark = createMemo(() => (row() + col()) % 2 === 0);

  // default background styles
  const defaultBgStyle = createMemo(() => (isDark() ? DARK : LIGHT));
  const defaultHoverStyle = createMemo(() =>
    isDark() ? DARK_HOVER_HIGHLIGHTED : LIGHT_HOVER_HIGHLIGHTED,
  );

  // Convert moves to {source, target} squares
  const squareMoves = createMemo(() => movesToSquares(local.moves()));

  createEffect(() => {
    if (squareMoves().some((m) => m.target === local.key)) {
      setBgStyle(isDark() ? DARK_HIGHLIGHTED : LIGHT_HIGHLIGHTED);
    } else if (squareMoves().some((m) => m.source === local.key)) {
      setBgStyle(isDark() ? DARK_SELECTED : LIGHT_SELECTED);
    } else {
      // Reset to default style when not a source or target
      setBgStyle(`${defaultBgStyle()} ${defaultHoverStyle()}`);
    }
  });

  return (
    <div
      class={`${bgStyle() ?? ''} ${rest.class ?? ''}`}
      style={{ width: squareWidth, height: squareHeight }}
      {...rest}
    >
      {local.children}
    </div>
  );
};

export default Square;
