import type { KeyboardEvent } from 'react';
import type { SquareView } from '~/utils/game-view';
import Piece from './piece';
import styles from './board.module.css';

const FILES = 'abcdefgh';

type SquareProps = {
  /**
   * Square to render.
   */
  square: SquareView;
  /**
   * Board orientation.
   */
  orientation: 'white' | 'black';
  /**
   * Tab index for roving focus.
   */
  tabIndex: number;
  /**
   * Selects or moves on this square.
   */
  onSelect: (key: number) => void;
  /**
   * Tracks the focused square.
   */
  onFocus: (key: number) => void;
  /**
   * Moves focus with the arrow keys.
   */
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>, key: number) => void;
  /**
   * Stores the button element for focus management.
   */
  buttonRef: (element: HTMLButtonElement | null) => void;
};

/**
 * One square and the piece sitting on it.
 */
const Square = (props: SquareProps) => {
  const { square, orientation, tabIndex, onSelect, onFocus, onKeyDown, buttonRef } = props;
  const row = Math.floor(square.key / 8);
  const column = square.key % 8;
  const file = FILES[column];
  const rank = 8 - row;
  const showFile = orientation === 'white' ? row === 7 : row === 0;
  const showRank = orientation === 'white' ? column === 0 : column === 7;

  const highlight = {
    none: '',
    selected: styles.selected,
    target: styles.target,
    latest: styles.latest,
  }[square.highlight];

  const classes = [styles.square, square.isLight ? styles.light : styles.dark, highlight]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      ref={buttonRef}
      className={classes}
      onClick={() => onSelect(square.key)}
      onFocus={() => onFocus(square.key)}
      onKeyDown={(event) => onKeyDown(event, square.key)}
      tabIndex={tabIndex}
      aria-label={`${file}${rank}`}
    >
      {square.pieceId != null ? <Piece pieceId={square.pieceId} checked={square.checked} /> : null}
      {showFile ? <span className={styles.file}>{file}</span> : null}
      {showRank ? <span className={styles.rank}>{rank}</span> : null}
    </button>
  );
};

export default Square;
