import { createMemo, splitProps, JSX, Accessor } from 'solid-js';
import { gameState, colors, PlayerColor } from '~/game/consts/board';
import { MoveList } from '~/game/move/move-def';
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
   * Handle click (selecting a piece or capturing another)
   *
   * @param e MouseEvent.
   */
  const handleClick: JSX.EventHandlerUnion<HTMLDivElement, MouseEvent> = (e) => {
    if (local.playerColor() !== gameState.side) return;

    if (isSide()) {
      e.stopPropagation();
      local.setMoves(local.moves);
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
      <img
        src={`/piece/sprite/${local.pieceId}.png`}
        draggable={false}
        class="relative z-10 w-16"
      />
    </div>
  );
};

export default Piece;
