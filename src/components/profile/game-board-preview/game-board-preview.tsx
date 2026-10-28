import { useMemo } from 'react';
import { useTranslation } from '@sun/i18n';
import Piece from '~/components/chess/piece';
import boardStyles from '~/components/chess/board.module.css';
import type { SerializedGameState } from '~/utils/game-serialize';
import styles from './game-board-preview.module.css';

type SerializedPiece = SerializedGameState['pieces'][number];

type GameBoardPreviewProps = {
  /**
   * Position to render.
   */
  state: SerializedGameState;
  /**
   * Square size in pixels.
   */
  size?: number;
};

/**
 * Read-only board for game history cards.
 */
const GameBoardPreview = (props: GameBoardPreviewProps) => {
  const { state, size = 32 } = props;
  const { t } = useTranslation('profile');
  const occupants = useMemo(() => {
    const bitboards = new Map(
      state.bitboards.map((entry) => [entry.pieceId, BigInt(entry.bitboard)]),
    );
    const cells: Array<SerializedPiece | null> = Array.from({ length: 64 }, () => null);
    for (const piece of state.pieces) {
      const bitboard = bitboards.get(piece.id) ?? 0n;
      for (let square = 0; square < 64; square += 1) {
        if (((bitboard >> BigInt(square)) & 1n) === 1n) {
          cells[square] = piece;
        }
      }
    }
    return cells;
  }, [state]);

  return (
    <div
      className={`${boardStyles.board} ${styles.preview}`}
      style={{ '--square-size': `${size}px` } as React.CSSProperties}
      role="img"
      aria-label={t('board-label')}
    >
      {occupants.map((piece, square) => {
        const row = Math.floor(square / 8);
        const column = square % 8;
        const light = (row + column) % 2 === 0;
        return (
          <div
            key={square}
            className={`${boardStyles.square} ${light ? boardStyles.light : boardStyles.dark}`}
          >
            {piece ? (
              <Piece
                piece={{
                  id: piece.id,
                  sprite: piece.sprite,
                  color: piece.color === 1 ? 1 : 0,
                  checked: false,
                }}
                decorative
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
};

export default GameBoardPreview;
