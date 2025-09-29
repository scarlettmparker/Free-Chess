import { createMemo, splitProps, JSX, Accessor } from 'solid-js';
import { gameState, moveType, colors, PlayerColor } from '~/game/consts/board';
import { MoveList } from '~/game/move/move-def';
import { copyBoard, takeBack } from '~/game/board/copy';
import { makeMove } from '~/game/move/move';
import { getPieceById } from '~/game/board/bitboard';

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
   * Player's current color.
   */
  playerColor: Accessor<PlayerColor | null>;

  /**
   * Setter for available moves to make.
   */
  setMoves: (moves: MoveList) => void;
};

/**
 * An individual piece.
 */
const Piece = (props: PieceProps) => {
  const [local, rest] = splitProps(props, [
    'pieceId',
    'moves',
    'playerColor',
    'setMoves',
    'onClick',
  ]);

  /**
   * Which side this piece belongs to (WHITE or BLACK).
   */
  const pieceSide = createMemo(() =>
    gameState.whitePieceIds.includes(local.pieceId) ? colors.WHITE : colors.BLACK,
  );

  // Checks the side the PIECE is on (not the player)
  const isSide = createMemo(() => pieceSide() === gameState.side);

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
    if (local.playerColor() !== gameState.side) return;

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

  /**
   * Decide if we want to visually represent a check.
   */
  const isChecked = createMemo(() => {
    const piece = getPieceById(local.pieceId);
    return !!piece?.getKing() && gameState.checked[pieceSide()] === true;
  });

  return (
    <div {...rest} onClick={handleClick} class="relative inline-block">
      {isChecked() && <div class="absolute inset-0 rounded-full bg-red-500 opacity-50 blur-md" />}
      <img src={`/piece/sprite/${local.pieceId}.png`} draggable={false} class="relative z-10" />
    </div>
  );
};

export default Piece;
