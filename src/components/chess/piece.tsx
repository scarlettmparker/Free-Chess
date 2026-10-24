import { gameState } from '~/game/consts/board';
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
  const enginePiece = gameState.pieces.find((piece) => piece.getId() === pieceId);
  const rawSprite = enginePiece?.getSprite();
  const sprite =
    rawSprite && rawSprite.headKey && rawSprite.bodyKey && rawSprite.footKey
      ? rawSprite
      : { headKey: 'king-head', bodyKey: 'king-body', footKey: 'king-foot' };

  return (
    <span className={styles.composite_piece} aria-label={t('piece')}>
      {checked ? <span className={styles.check_glow} aria-hidden="true" /> : null}
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
