import { gameState, colors } from '../game/consts/board';
import { MoveList } from '../game/move/movedef';

type PieceProps = {
  /**
   * Piece id (used for loading the piece image).
   */
  pieceId: number;

  /**
   * Pieces list of available moves.
   */
  moves: MoveList;

  /**
   * Setter for available moves to make.
   */
  setMoves: (moves: MoveList) => void;
};

/**
 * An individual piece.
 */
const Piece = (props: PieceProps) => {
  const { pieceId, moves, setMoves } = props;
  const isSide =
    gameState.side == colors.WHITE
      ? gameState.whitePieceIds.includes(pieceId)
      : gameState.blackPieceIds.includes(pieceId);

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        isSide && setMoves(moves);
      }}
    >
      <img src={`/piece/${pieceId}.png`} draggable={false} />
    </div>
  );
};

export default Piece;
