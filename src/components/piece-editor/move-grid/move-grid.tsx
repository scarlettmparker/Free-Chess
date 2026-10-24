import styles from './move-grid.module.css';
import { partUrl } from '~/components/chess/piece';

type MoveGridProps = {
  /**
   * Selected vectors.
   */
  vectors: { dx: number; dy: number; range: string; capture: string }[];
  /**
   * Sprite keys for the centre piece.
   */
  sprite: { headKey: string; bodyKey: string; footKey: string };
  /**
   * Called when a cell is toggled.
   *
   * @param dx Horizontal offset.
   * @param dy Vertical offset.
   */
  onToggle: (dx: number, dy: number) => void;
};

/**
 * 15 by 15 move grid matching the game board.
 */
const MoveGrid = (props: MoveGridProps) => {
  const { vectors, sprite, onToggle } = props;
  const cells = [];
  for (let row = 0; row < 15; row++) {
    for (let col = 0; col < 15; col++) {
      const dx = col - 7;
      const dy = 7 - row;
      const vector = vectors.find((v) => v.dx === dx && v.dy === dy);
      const rangeClass = vector ? styles[`cell_${vector.range}`] : '';
      const isLight = (row + col) % 2 === 0;
      const isCentre = dx === 0 && dy === 0;
      cells.push(
        <div
          key={`${row}-${col}`}
          className={`${styles.cell} ${isLight ? styles.light : styles.dark} ${rangeClass}`}
          onClick={() => onToggle(dx, dy)}
        >
          {isCentre ? (
            <span className={styles.centre_piece}>
              <img src={partUrl(sprite.headKey)} alt="" />
              <img src={partUrl(sprite.bodyKey)} alt="" />
              <img src={partUrl(sprite.footKey)} alt="" />
            </span>
          ) : null}
        </div>,
      );
    }
  }
  return <div className={styles.grid}>{cells}</div>;
};

export default MoveGrid;
