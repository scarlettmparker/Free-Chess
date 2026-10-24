import styles from './board.module.css';

type PieceProps = {
  /**
   * Piece id used by the sprite sheet.
   */
  pieceId: number;
};

/**
 * Piece sprite.
 */
const Piece = (props: PieceProps) => {
  const { pieceId } = props;
  return (
    <img className={styles.piece} src={`/piece/sprite/${pieceId}.png`} alt="" draggable={false} />
  );
};

export default Piece;
