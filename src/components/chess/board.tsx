import { useRef, useState, type KeyboardEvent } from 'react';
import { useTranslation } from '@sun/i18n';
import type { BoardView } from '~/utils/game-view';
import Square from './square';
import styles from './board.module.css';

type BoardProps = {
  /**
   * Snapshot of the board.
   */
  view: BoardView;
  /**
   * Selects or moves on a square.
   */
  onSelect: (key: number) => void;
};

/**
 * Eight by eight board with roving focus.
 */
const Board = (props: BoardProps) => {
  const { view, onSelect } = props;
  const { t } = useTranslation('chess');
  const [focusKey, setFocusKey] = useState(0);
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);

  const order = Array.from({ length: 64 }, (_, index) =>
    view.orientation === 'black' ? 63 - index : index,
  );

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, key: number) => {
    const row = Math.floor(key / 8);
    const column = key % 8;
    const step = view.orientation === 'white' ? 1 : -1;
    let next = key;

    switch (event.key) {
      case 'ArrowUp':
        next = key - 8 * step;
        break;
      case 'ArrowDown':
        next = key + 8 * step;
        break;
      case 'ArrowLeft':
        next = key - step;
        break;
      case 'ArrowRight':
        next = key + step;
        break;
      default:
        return;
    }

    event.preventDefault();
    const nextRow = Math.floor(next / 8);
    const nextColumn = next % 8;
    if (next < 0 || next > 63) return;
    if (Math.abs(nextRow - row) > 1 || Math.abs(nextColumn - column) > 1) return;

    setFocusKey(next);
    buttons.current[next]?.focus();
  };

  return (
    <div className={styles.board} role="group" aria-label={t('board')}>
      {order.map((key) => (
        <Square
          key={key}
          square={view.squares[key]}
          orientation={view.orientation}
          tabIndex={key === focusKey ? 0 : -1}
          onSelect={onSelect}
          onFocus={setFocusKey}
          onKeyDown={handleKeyDown}
          buttonRef={(element) => {
            buttons.current[key] = element;
          }}
        />
      ))}
    </div>
  );
};

export default Board;
