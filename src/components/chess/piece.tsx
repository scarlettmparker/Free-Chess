import styles from './board.module.css';

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
 * Piece sprite and check glow.
 */
const Piece = (props: PieceProps) => {
  const { pieceId, checked } = props;
  return (
    <>
      {checked ? <span className={styles.checkGlow} aria-hidden="true" /> : null}
      <img className={styles.piece} src={`/piece/sprite/${pieceId}.png`} alt="" draggable={false} />
    </>
  );
};

export default Piece;
