import { createMemo, splitProps, JSX } from 'solid-js';
import { gameState, colors, moveType } from '~/game/consts/board';
import { MoveList } from '~/game/move/move-def';
import { copyBoard, takeBack } from '~/game/board/copy';
import { makeMove } from '~/game/move/move';

type PieceProps = JSX.HTMLAttributes<HTMLDivElement> & {
  /**
   * Piece id (used for loading the piece image).
   */
  pieceId: number;

  /**
   * Piece's list of available moves.
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
const Piece = (allProps: PieceProps) => {
  const [local, rest] = splitProps(allProps, ['pieceId', 'moves', 'setMoves', 'onClick']);

  const isSide = createMemo(() =>
    gameState.side === colors.WHITE
      ? gameState.whitePieceIds.includes(local.pieceId)
      : gameState.blackPieceIds.includes(local.pieceId),
  );

  /**
   * Filter legal moves. Only pseudo-legal moves are generated in the piece itself.
   * This is only the client side check for it.
   *
   * @param raw Piece move list.
   */
  const filterLegalMoves = (raw: MoveList): MoveList => {
    if (!raw || raw.count === 0) return { moves: [], count: 0 };
    const filtered: MoveList = { moves: [], count: 0 };

    for (let i = 0; i < raw.count; i++) {
      const move = raw.moves[i];

      // Copy the board and test the move
      const copies = copyBoard();
      const ok = makeMove(move, moveType.ALL_MOVES, 0);
      takeBack(copies);

      if (ok) {
        filtered.moves.push(move);
        filtered.count++;
      }
    }

    return filtered;
  };

  /**
   * Handle click (selecting a piece or capturing another)
   *
   * @param e MouseEvent.
   */
  const handleClick: JSX.EventHandlerUnion<HTMLDivElement, MouseEvent> = (e) => {
    if (isSide()) {
      e.stopPropagation();
      const legal = filterLegalMoves(local.moves);
      local.setMoves(legal);
    }
    // Always call parent-provided onClick if it exists
    const parentHandler = local.onClick as
      | ((event: MouseEvent & { currentTarget: HTMLDivElement; target: Element }) => void)
      | undefined;

    parentHandler?.(e as MouseEvent & { currentTarget: HTMLDivElement; target: Element });
  };

  return (
    <div {...rest} onClick={handleClick}>
      <img src={`/piece/${local.pieceId}.png`} draggable={false} />
    </div>
  );
};

export default Piece;
