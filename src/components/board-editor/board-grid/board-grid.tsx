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
 * Eight by eight board grid with drag painting. Left click paints, right click erases.
 */
const BoardGrid = (props: BoardGridProps) => {
  const { placements, sprites, onPaint } = props;
  const gridRef = useRef<HTMLDivElement | null>(null);
  const dragAdd = useRef<boolean | null>(null);

  useEffect(() => {
    const stopDragging = () => {
      dragAdd.current = null;
    };
    /**
     * Kills the browser menu for presses inside the grid. Native capture
     * fires where the React handler can miss, e.g. mid right-drag.
     *
     * @param event Context menu event.
     */
    const suppressMenu = (event: Event) => {
      if (gridRef.current?.contains(event.target as Node)) event.preventDefault();
    };
    window.addEventListener('pointerup', stopDragging);
    window.addEventListener('pointercancel', stopDragging);
    window.addEventListener('contextmenu', suppressMenu, true);
    return () => {
      window.removeEventListener('pointerup', stopDragging);
      window.removeEventListener('pointercancel', stopDragging);
      window.removeEventListener('contextmenu', suppressMenu, true);
    };
  }, []);

  const bySquare = new Map(placements.map((placement) => [placement.square, placement]));

  /**
   * Starts a paint stroke on one square. Left click paints, right click erases.
   * Holding control or command paints only empty squares instead of overriding.
   *
   * @param event Pointer event.
   * @param square Square index.
   */
  const handlePointerDown = (event: PointerEvent<HTMLDivElement>, square: number) => {
    if (event.button !== 0 && event.button !== 2) return;
    event.preventDefault();
    const add = event.button === 0;
    dragAdd.current = add;
    if (add && (event.ctrlKey || event.metaKey) && bySquare.has(square)) return;
    onPaint(square, add);
  };

  /**
   * Continues a paint stroke in the mode it started with.
   *
   * @param event Pointer event.
   * @param square Square index.
   */
  const handlePointerEnter = (event: PointerEvent<HTMLDivElement>, square: number) => {
    if (dragAdd.current === null) return;
    if (dragAdd.current && (event.ctrlKey || event.metaKey) && bySquare.has(square)) return;
    onPaint(square, dragAdd.current);
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
        onPointerEnter={(event) => handlePointerEnter(event, square)}
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
    <div className={styles.grid} ref={gridRef}>
      {cells}
    </div>
  );
};

export default BoardGrid;
