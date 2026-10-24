import { useEffect, useRef } from 'react';
import type { PointerEvent } from 'react';
import { partUrl } from '~/components/chess/piece';
import type { BoardPlacement } from '~/game/board/validate-layout';
import styles from './board-grid.module.css';

type BoardGridProps = {
  /**
   * Current placements.
   */
  placements: BoardPlacement[];
  /**
   * Sprites by definition id.
   */
  sprites: Map<number, { headKey: string; bodyKey: string; footKey: string }>;
  /**
   * Paint or erase one square.
   *
   * @param square Square index.
   * @param add Whether to paint or erase.
   */
  onPaint: (square: number, add: boolean) => void;
};

/**
 * Eight by eight board grid with drag painting. Right click erases.
 */
const BoardGrid = (props: BoardGridProps) => {
  const { placements, sprites, onPaint } = props;
  const dragAdd = useRef<boolean | null>(null);
  const dragErase = useRef(false);
  const dragCells = useRef<Set<number>>(new Set());

  useEffect(() => {
    const stopDragging = () => {
      dragAdd.current = null;
      dragCells.current.clear();
    };
    window.addEventListener('pointerup', stopDragging);
    window.addEventListener('pointercancel', stopDragging);
    return () => {
      window.removeEventListener('pointerup', stopDragging);
      window.removeEventListener('pointercancel', stopDragging);
    };
  }, []);

  const bySquare = new Map(placements.map((placement) => [placement.square, placement]));

  /**
   * Starts a paint stroke on one square. Right click erases instead.
   *
   * @param event Pointer event.
   * @param square Square index.
   */
  const handlePointerDown = (event: PointerEvent<HTMLDivElement>, square: number) => {
    if (event.button !== 0 && event.button !== 2) return;
    event.preventDefault();
    const erase = event.button === 2;
    dragErase.current = erase;
    dragAdd.current = !erase;
    dragCells.current = new Set([square]);
    onPaint(square, !erase);
  };

  /**
   * Continues a paint stroke, toggling squares the stroke crosses twice.
   *
   * @param square Square index.
   */
  const handlePointerEnter = (square: number) => {
    if (dragAdd.current === null) return;
    const changed = dragCells.current.has(square);
    if (changed) {
      dragCells.current.delete(square);
    } else {
      dragCells.current.add(square);
    }
    onPaint(square, dragErase.current ? false : changed ? !dragAdd.current : dragAdd.current);
  };

  /**
   * Suppresses the context menu so right click can erase.
   *
   * @param event Context menu event.
   */
  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
  };

  const cells = [];
  for (let square = 0; square < 64; square++) {
    const row = Math.floor(square / 8);
    const col = square % 8;
    const isLight = (row + col) % 2 === 0;
    const placement = bySquare.get(square);
    const sprite = placement ? sprites.get(placement.definitionId) : undefined;
    cells.push(
      <div
        key={square}
        className={`${styles.cell} ${isLight ? styles.light : styles.dark}`}
        onPointerDown={(event) => handlePointerDown(event, square)}
        onPointerEnter={() => handlePointerEnter(square)}
      >
        {sprite && placement ? (
          <span className={styles.piece}>
            <img src={partUrl(sprite.headKey, placement.color)} alt="" draggable={false} />
            <img src={partUrl(sprite.bodyKey, placement.color)} alt="" draggable={false} />
            <img src={partUrl(sprite.footKey, placement.color)} alt="" draggable={false} />
          </span>
        ) : null}
        {row === 7 ? <span className={styles.file}>{'abcdefgh'[col]}</span> : null}
        {col === 0 ? <span className={styles.rank}>{8 - row}</span> : null}
      </div>,
    );
  }
  return (
    <div className={styles.grid} onContextMenu={handleContextMenu}>
      {cells}
    </div>
  );
};

export default BoardGrid;
