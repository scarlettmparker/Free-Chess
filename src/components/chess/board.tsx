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
 * Eight by eight board.
 */
const Board = (props: BoardProps) => {
  const { view, onSelect } = props;
  const { t } = useTranslation('chess');
  const order = Array.from({ length: 64 }, (_, index) =>
    view.orientation === 'black' ? 63 - index : index,
  );

  return (
    <div className={styles.board} role="grid" aria-label={t('board')}>
      {order.map((key) => (
        <Square
          key={key}
          square={view.squares[key]}
          orientation={view.orientation}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
};

export default Board;
