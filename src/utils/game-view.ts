import { getBit, getPieceById } from '~/game/board/bitboard';
import { BOARD_SIZE, colors, gameState, getBitboard, type PlayerColor } from '~/game/consts/board';
import { generateMoves } from '~/game/move/legal-move-generator';
import { isLegalMove } from '~/game/move/move';
import { getMovePiece, getMoveSource, getMoveTarget, type MoveList } from '~/game/move/move-def';

export type SquareHighlight = 'none' | 'selected' | 'target' | 'latest';

export type SquareView = {
  /**
   * Square index, 0-63.
   */
  key: number;
  /**
   * Whether the square is dark.
   */
  isDark: boolean;
  /**
   * Piece on the square, if any.
   */
  pieceId: number | null;
  /**
   * Legal moves starting from this square.
   */
  moves: MoveList;
  /**
   * Highlight applied by selection or the latest move.
   */
  highlight: SquareHighlight;
  /**
   * Whether the king on this square is in check.
   */
  checked: boolean;
  /**
   * Whether the piece can be selected by the player to move.
   */
  selectable: boolean;
};

export type BoardView = {
  /**
   * All 64 squares in board order.
   */
  squares: SquareView[];
  /**
   * Side to move.
   */
  side: PlayerColor;
  /**
   * Colour the player was assigned, or null for a spectator.
   */
  playerColor: PlayerColor | null;
  /**
   * Orientation the board should be rendered in.
   */
  orientation: 'white' | 'black';
  /**
   * Most recent move, if any.
   */
  latestMove: number | null;
  /**
   * Square of the selected piece, if any.
   */
  selectedSquare: number | null;
  /**
   * Whether the side to move has no legal moves.
   */
  gameOver: boolean;
  /**
   * Whether this player may move right now.
   */
  canMove: boolean;
};

export const EMPTY_MOVE_LIST: MoveList = { moves: [], count: 0 };

/**
 * Builds a view with no pieces, used before the client mounts.
 */
export function emptyBoardView(playerColor: PlayerColor | null = null): BoardView {
  return {
    squares: Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, key) => ({
      key,
      isDark: (Math.floor(key / BOARD_SIZE) + (key % BOARD_SIZE)) % 2 === 0,
      pieceId: null,
      moves: EMPTY_MOVE_LIST,
      highlight: 'none',
      checked: false,
      selectable: false,
    })),
    side: colors.WHITE,
    playerColor,
    orientation: playerColor === colors.BLACK ? 'black' : 'white',
    latestMove: null,
    selectedSquare: null,
    gameOver: false,
    canMove: false,
  };
}

/**
 * Maps square index to the piece sitting on it.
 */
function mapPieces(): Array<number | null> {
  const pieces = Array.from<number | null>({ length: BOARD_SIZE * BOARD_SIZE }).fill(null);
  for (const pieceId of [...gameState.whitePieceIds, ...gameState.blackPieceIds]) {
    const bb = getBitboard(pieceId);
    for (let key = 0; key < pieces.length; key++) {
      if (getBit(bb.lo, bb.hi, key)) {
        pieces[key] = pieceId;
      }
    }
  }
  return pieces;
}

/**
 * Groups legal moves by the piece and square they start from.
 */
function mapMoves(legalMoves: number[]): Map<string, MoveList> {
  const byPieceAndSquare = new Map<string, MoveList>();

  for (const move of legalMoves) {
    const key = `${getMovePiece(move)}-${getMoveSource(move)}`;
    let list = byPieceAndSquare.get(key);
    if (!list) {
      list = { moves: [], count: 0 };
      byPieceAndSquare.set(key, list);
    }
    list.moves.push(move);
    list.count++;
  }

  return byPieceAndSquare;
}

/**
 * Snapshots the engine into an immutable board view.
 */
export function buildBoardView(
  selectedSquare: number | null,
  playerColor: PlayerColor | null,
): BoardView {
  const candidates: MoveList = { moves: [], count: 0 };
  generateMoves(candidates, gameState.pieces);

  const legalMoves = candidates.moves.filter((move) => isLegalMove(move));
  const sideMoves = legalMoves.filter((move) => {
    const pieceId = getMovePiece(move);
    return gameState.side === colors.WHITE
      ? gameState.whitePieceIds.includes(pieceId)
      : gameState.blackPieceIds.includes(pieceId);
  });

  const pieces = mapPieces();
  const movesByPieceAndSquare = mapMoves(legalMoves);
  const latestMove = gameState.moveHistory[gameState.moveHistory.length - 1] ?? null;
  const latestSource = latestMove == null ? -1 : getMoveSource(latestMove);
  const latestTarget = latestMove == null ? -1 : getMoveTarget(latestMove);

  const selectedMoves =
    selectedSquare == null || pieces[selectedSquare] == null
      ? null
      : (movesByPieceAndSquare.get(`${pieces[selectedSquare]}-${selectedSquare}`) ?? null);

  const gameOver = sideMoves.length === 0;
  const canMove = playerColor != null && playerColor === gameState.side && !gameOver;

  const squares: SquareView[] = pieces.map((pieceId, key) => {
    const isWhitePiece = pieceId != null && gameState.whitePieceIds.includes(pieceId);
    const piece = pieceId == null ? null : getPieceById(pieceId);

    let highlight: SquareHighlight = 'none';
    if (selectedSquare != null) {
      if (key === selectedSquare) {
        highlight = 'selected';
      } else if (selectedMoves?.moves.some((move) => getMoveTarget(move) === key)) {
        highlight = 'target';
      }
    }
    if (highlight === 'none' && (key === latestSource || key === latestTarget)) {
      highlight = 'latest';
    }

    return {
      key,
      isDark: (Math.floor(key / BOARD_SIZE) + (key % BOARD_SIZE)) % 2 === 0,
      pieceId,
      moves:
        pieceId == null
          ? EMPTY_MOVE_LIST
          : (movesByPieceAndSquare.get(`${pieceId}-${key}`) ?? EMPTY_MOVE_LIST),
      highlight,
      checked:
        piece != null &&
        piece.getKing() &&
        gameState.checked[isWhitePiece ? colors.WHITE : colors.BLACK] === true,
      selectable:
        canMove &&
        isWhitePiece === (gameState.side === colors.WHITE) &&
        (movesByPieceAndSquare.get(`${pieceId}-${key}`)?.count ?? 0) > 0,
    };
  });

  return {
    squares,
    side: gameState.side as PlayerColor,
    playerColor,
    orientation: playerColor === colors.BLACK ? 'black' : 'white',
    latestMove,
    selectedSquare,
    gameOver,
    canMove,
  };
}
