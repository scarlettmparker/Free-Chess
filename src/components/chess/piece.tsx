import { peekPageData } from '@sun/ssr';
import { useTranslation } from '@sun/i18n';
import styles from './piece.module.css';

type PieceProps = {
  /**
   * Piece id used by the sprite sheet.
   */
  pieceId: number;
  /**
   * Whether the king is in check.
   */
  checked: boolean;
};

/**
 * Resolve a part key to a URL.
 *
 * @param key Part key.
 * @returns Part URL.
 */
export function partUrl(key: string): string {
  return `/piece/parts/${key}.png`;
}

/**
 * Piece sprite rendered as head/body/foot layers.
 */
const Piece = (props: PieceProps) => {
  const { pieceId, checked } = props;
  const { t } = useTranslation('chess');
  const data = peekPageData<{
    pieces: { id: number; sprite: { headKey: string; bodyKey: string; footKey: string } }[];
  }>('pieces', 'pieces', {});
  const piece = data?.pieces?.find((p) => p.id === pieceId);
  const sprite = piece?.sprite ?? { headKey: '', bodyKey: '', footKey: '' };

  return (
    <span className={styles.composite_piece} aria-label={t('piece')}>
      {checked ? <span className={styles.checkGlow} aria-hidden="true" /> : null}
      <img
        className={styles.part_head}
        src={partUrl(sprite.headKey)}
        alt={t('piece-head')}
        draggable={false}
      />
      <img
        className={styles.part_body}
        src={partUrl(sprite.bodyKey)}
        alt={t('piece-body')}
        draggable={false}
      />
      <img
        className={styles.part_foot}
        src={partUrl(sprite.footKey)}
        alt={t('piece-foot')}
        draggable={false}
      />
    </span>
  );
};

export default Piece;
