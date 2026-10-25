import { useEffect, useRef } from 'react';
import type { PointerEvent } from 'react';
import styles from './move-grid.module.css';
import { partUrl } from '~/components/chess/piece';
import { isCompassDirection } from '~/game/piece/piece-definition';

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
   * Move type being painted.
   */
  moveType: 'step' | 'slide' | 'hop';
  /**
   * Sets whether a cell holds a vector.
   *
   * @param dx Horizontal offset.
   * @param dy Vertical offset.
   * @param add Whether to add or remove the vector.
   */
  onPaint: (dx: number, dy: number, add: boolean) => void;
  /**
   * Whether painting is disabled.
   */
  readOnly?: boolean;
};

/**
 * 15 by 15 move grid matching the game board.
 */
const MoveGrid = (props: MoveGridProps) => {
  const { vectors, sprite, moveType, onPaint, readOnly = false } = props;
  const gridRef = useRef<HTMLDivElement | null>(null);
  const dragAdd = useRef<boolean | null>(null);

  useEffect(() => {
    const stopDragging = () => {
      dragAdd.current = null;
    };
    /**
     * Kills the browser menu for presses inside the grid. Native capture
     * fires where a React handler can miss, e.g. mid right-drag.
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

  const canPaint = (dx: number, dy: number, add: boolean) =>
    !add || moveType !== 'slide' || isCompassDirection(dx, dy);

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>, dx: number, dy: number) => {
    if (readOnly) return;
    if (event.button !== 0 && event.button !== 2) return;
    event.preventDefault();
    const add = event.button === 0;
    if (!canPaint(dx, dy, add)) return;
    dragAdd.current = add;
    if (
      add &&
      (event.ctrlKey || event.metaKey) &&
      vectors.some((vector) => vector.dx === dx && vector.dy === dy)
    )
      return;
    onPaint(dx, dy, add);
  };

  const handlePointerEnter = (event: PointerEvent<HTMLDivElement>, dx: number, dy: number) => {
    if (readOnly) return;
    if (dragAdd.current === null) return;
    if (!canPaint(dx, dy, dragAdd.current)) return;
    if (
      dragAdd.current &&
      (event.ctrlKey || event.metaKey) &&
      vectors.some((vector) => vector.dx === dx && vector.dy === dy)
    )
      return;
    onPaint(dx, dy, dragAdd.current);
  };

  const cells = [];
  for (let row = 0; row < 15; row++) {
    for (let col = 0; col < 15; col++) {
      const dx = col - 7;
      const dy = 7 - row;
      const isCentre = dx === 0 && dy === 0;
      const vector = isCentre ? undefined : vectors.find((v) => v.dx === dx && v.dy === dy);
      const rangeClass = vector ? styles[`cell_${vector.range}`] : '';
      const isLight = (row + col) % 2 === 0;
      cells.push(
        <div
          key={`${row}-${col}`}
          className={`${styles.cell} ${isLight ? styles.light : styles.dark} ${rangeClass} ${
            isCentre ? styles.centre_cell : ''
          }`}
          onPointerDown={isCentre ? undefined : (event) => handlePointerDown(event, dx, dy)}
          onPointerEnter={isCentre ? undefined : (event) => handlePointerEnter(event, dx, dy)}
        >
          {isCentre ? (
            <span className={styles.centre_piece}>
              <img src={partUrl(sprite.headKey, 0)} alt="" />
              <img src={partUrl(sprite.bodyKey, 0)} alt="" />
              <img src={partUrl(sprite.footKey, 0)} alt="" />
            </span>
          ) : null}
        </div>,
      );
    }
  }
  return (
    <div className={styles.grid} ref={gridRef}>
      {cells}
    </div>
  );
};

export default MoveGrid;
