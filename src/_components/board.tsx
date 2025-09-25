import { JSX } from 'solid-js/jsx-runtime';
import { WIDTH, BOARD_SIZE, HEIGHT } from '../game/consts/board';
import { splitProps } from 'solid-js';

type BoardProps = {
  /**
   * Squares and pieces.
   */
  children: JSX.Element | JSX.Element[];
} & JSX.HTMLAttributes<HTMLDivElement>;

/**
 * Chess board component.
 */
const Board = (_props: BoardProps) => {
  const [props, rest] = splitProps(_props, ['children']);
  const boardSizeWidth = `${WIDTH * BOARD_SIZE}px`;
  const boardSizeHeight = `${HEIGHT * BOARD_SIZE}px`;

  return (
    <div
      {...rest}
      class={`flex flex-wrap bg-white ${rest.class}`}
      style={{ width: boardSizeWidth, height: boardSizeHeight }}
    >
      {props.children}
    </div>
  );
};

export default Board;
