import { partUrl } from '~/components/chess/piece';
import type { BoardLayoutDto } from '~/server/board-layouts';
import styles from './board-preview.module.css';

type BoardPreviewProps = {
  /**
   * Layout to render.
   */
  layout: BoardLayoutDto;
  /**
   * Sprites by definition id.
   */
  sprites: Map<number, { headKey: string; bodyKey: string; footKey: string }>;
};

/**
 * Read-only miniature preview of a layout's placements.
 */
const BoardPreview = (props: BoardPreviewProps) => {
  const { layout, sprites } = props;
  const bySquare = new Map(layout.placements.map((placement) => [placement.square, placement]));
  const cells = [];
  for (let square = 0; square < 64; square++) {
    const row = Math.floor(square / 8);
    const col = square % 8;
    const placement = bySquare.get(square);
    const sprite = placement ? sprites.get(placement.definitionId) : undefined;
    cells.push(
      <div
        key={square}
        className={`${styles.cell} ${(row + col) % 2 === 0 ? styles.light : styles.dark}`}
      >
        {sprite && placement ? (
          <span className={styles.piece}>
            <img src={partUrl(sprite.headKey, placement.color)} alt="" draggable={false} />
            <img src={partUrl(sprite.bodyKey, placement.color)} alt="" draggable={false} />
            <img src={partUrl(sprite.footKey, placement.color)} alt="" draggable={false} />
          </span>
        ) : null}
      </div>,
    );
  }
  return <div className={styles.preview}>{cells}</div>;
};

export default BoardPreview;
