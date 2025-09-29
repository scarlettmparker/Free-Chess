import { JSX } from 'solid-js/jsx-runtime';
import { splitProps } from 'solid-js';
import { WIDTH, BOARD_SIZE, HEIGHT } from './const';

type BoardProps = {
  /**
   * Squares and pieces.
   */
  children: JSX.Element | JSX.Element[];
} & JSX.HTMLAttributes<HTMLDivElement>;

/**
 * Chess board component.
 */
const Board = (props: BoardProps) => {
  const [local, rest] = splitProps(props, ['children']);
  const boardSizeWidth = `${WIDTH * BOARD_SIZE}px`;
  const boardSizeHeight = `${HEIGHT * BOARD_SIZE}px`;

  return (
    <div
      {...rest}
      class={`flex flex-wrap bg-white ${rest.class}`}
      style={{ width: boardSizeWidth, height: boardSizeHeight }}
    >
      {local.children}
    </div>
  );
};

export default Board;
