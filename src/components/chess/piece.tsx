import { useTranslation } from '@sun/i18n';
import styles from './piece.module.css';

export type PieceSprite = {
  /**
   * Head sprite key.
   */
  headKey: string;
  /**
   * Body sprite key.
   */
  bodyKey: string;
  /**
   * Foot sprite key.
   */
  footKey: string;
};

export type PieceVisual = {
  /**
   * Piece id.
   */
  id: number;
  /**
   * Sprite keys for the piece.
   */
  sprite: PieceSprite;
  /**
   * Piece colour, 0 for white and 1 for black.
   */
  color: 0 | 1;
  /**
   * Whether the king is in check.
   */
  checked: boolean;
};

type PieceProps = {
  /**
   * Piece to render.
   */
  piece: PieceVisual;
  /**
   * Whether the piece is decorative.
   */
  decorative?: boolean;
};

/**
 * Resolve a part key to a URL.
 *
 * @param key Part key.
 * @param color Piece colour, 0 for white and 1 for black.
 * @returns Part URL.
 */
export function partUrl(key: string, color: 0 | 1): string {
  return `/piece/parts/${key}-${color === 0 ? 'white' : 'black'}.png`;
}

/**
 * Piece sprite rendered as head, body and foot layers.
 */
const Piece = (props: PieceProps) => {
  const { piece, decorative } = props;
  const { t } = useTranslation('chess');
  const sprite =
    piece.sprite.headKey && piece.sprite.bodyKey && piece.sprite.footKey
      ? piece.sprite
      : { headKey: 'king-head', bodyKey: 'king-body', footKey: 'king-foot' };

  return (
    <span
      className={styles.composite_piece}
      aria-label={decorative ? undefined : t('piece')}
      aria-hidden={decorative ? 'true' : undefined}
    >
      {piece.checked ? <span className={styles.check_glow} aria-hidden="true" /> : null}
      <img
        className={styles.part_head}
        src={partUrl(sprite.headKey, piece.color)}
        alt={decorative ? '' : t('piece-head')}
        draggable={false}
      />
      <img
        className={styles.part_body}
        src={partUrl(sprite.bodyKey, piece.color)}
        alt={decorative ? '' : t('piece-body')}
        draggable={false}
      />
      <img
        className={styles.part_foot}
        src={partUrl(sprite.footKey, piece.color)}
        alt={decorative ? '' : t('piece-foot')}
        draggable={false}
      />
    </span>
  );
};

export default Piece;
