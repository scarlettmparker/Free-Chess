import { Accessor, createSignal, createMemo, createEffect, splitProps } from 'solid-js';
import { JSX } from 'solid-js/jsx-runtime';
import { colors, type PlayerColor } from '~/game/consts/board';
import { MoveList } from '~/game/move/move-def';
import { movesToSquares } from '~/utils';
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
} from './const';

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
   * Player's current color.
   */
  playerColor: Accessor<PlayerColor | null>;
};

/**
 * An individual square.
 */
const Square = (props: SquareProps) => {
  const [local, rest] = splitProps(props, ['key', 'children', 'moves', 'playerColor']);
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

  const fileLetter = createMemo(() => String.fromCharCode(97 + col()));
  const rankNumber = createMemo(() => BOARD_SIZE - row());
  const textColor = createMemo(() => (isDark() ? 'text-black' : 'text-white'));

  return (
    <div
      class={`${bgStyle() ?? ''} ${rest.class ?? ''} relative`}
      style={{ width: squareWidth, height: squareHeight }}
      {...rest}
    >
      {local.children}

      {/* Show file letter on bottom row */}
      {row() === BOARD_SIZE - (local.playerColor() == colors.WHITE ? 1 : 8) && (
        <span class={`${textColor()} text-xs font-bold absolute bottom-0 left-1`}>
          {fileLetter()}
        </span>
      )}

      {/* Show rank number on right column */}
      {col() === BOARD_SIZE - (local.playerColor() == colors.WHITE ? 1 : 8) && (
        <span class={`${textColor()} text-xs font-bold absolute top-0.5 right-1`}>
          {rankNumber()}
        </span>
      )}
    </div>
  );
};

export default Square;
