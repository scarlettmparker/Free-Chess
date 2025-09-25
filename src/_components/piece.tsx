import { createMemo } from 'solid-js';
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
  const isSide = createMemo(() =>
    gameState.side === colors.WHITE
      ? gameState.whitePieceIds.includes(props.pieceId)
      : gameState.blackPieceIds.includes(props.pieceId),
  );

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        if (isSide()) {
          props.setMoves(props.moves);
        }
      }}
    >
      <img src={`/piece/${props.pieceId}.png`} draggable={false} />
    </div>
  );
};

export default Piece;
