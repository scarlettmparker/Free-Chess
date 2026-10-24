import { Button } from '@sun/components';
import styles from './move-grid.module.css';

type MoveGridProps = {
  /**
   * Selected vectors.
   */
  vectors: { dx: number; dy: number; range: string; capture: string }[];
  /**
   * Called when a cell is toggled.
   *
   * @param dx Horizontal offset.
   * @param dy Vertical offset.
   */
  onToggle: (dx: number, dy: number) => void;
};

/**
 * 15 by 15 move grid with the piece at the centre.
 */
const MoveGrid = (props: MoveGridProps) => {
  const { vectors, onToggle } = props;
  const cells = [];
  for (let row = 0; row < 15; row++) {
    for (let col = 0; col < 15; col++) {
      const dx = col - 7;
      const dy = 7 - row;
      const active = vectors.some((v) => v.dx === dx && v.dy === dy);
      cells.push(
        <Button
          key={`${row}-${col}`}
          variant={active ? 'default' : 'secondary'}
          className={styles.cell}
          onClick={() => onToggle(dx, dy)}
        >
          {dx === 0 && dy === 0 ? 'P' : ''}
        </Button>,
      );
    }
  }
  return <div className={styles.grid}>{cells}</div>;
};

export default MoveGrid;
