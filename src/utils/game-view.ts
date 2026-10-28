import { getBit, getPieceById } from '~/game/board/bitboard';
import {
  BOARD_SIZE,
  colors,
  gameState,
  getBitboard,
  type GameResult,
  type PlayerColor,
} from '~/game/consts/board';
import { generateMoves } from '~/game/move/legal-move-generator';
import { isLegalMove } from '~/game/move/move';
import { getMovePiece, getMoveSource, getMoveTarget, type MoveList } from '~/game/move/move-def';
import type { PieceVisual } from '~/components/chess/piece';

export type SquareHighlight = 'none' | 'selected' | 'target' | 'latest';

export type SquareView = {
  /**
   * Square index, 0-63.
   */
  key: number;
  /**
   * Whether the square is light.
   */
  isLight: boolean;
  /**
   * Piece on the square, if any.
   */
  piece: PieceVisual | null;
  /**
   * Legal moves starting from this square.
   */
  moves: MoveList;
  /**
   * Highlight applied by selection or the latest move.
   */
  highlight: SquareHighlight;
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
   * Whether the game has finished.
   */
  gameOver: boolean;
  /**
   * Finished-game result, or null while the game is running.
   */
  result: GameResult;
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
      isLight: (Math.floor(key / BOARD_SIZE) + (key % BOARD_SIZE)) % 2 === 0,
      piece: null,
      moves: EMPTY_MOVE_LIST,
      highlight: 'none',
      selectable: false,
    })),
    side: colors.WHITE,
    playerColor,
    orientation: playerColor === colors.BLACK ? 'black' : 'white',
    latestMove: null,
    selectedSquare: null,
    gameOver: false,
    result: null,
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
 *
 * @param selectedSquare Square selected by the user, or null.
 * @param playerColor Colour assigned to this client, or null.
 * @param viewMoveIndex Move-history index to highlight, or the latest move when omitted.
 * @param atLatest Whether the viewed position is the live position.
 * @returns The board view.
 */
export function buildBoardView(
  selectedSquare: number | null,
  playerColor: PlayerColor | null,
  viewMoveIndex?: number,
  atLatest = true,
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
  const moveCount = gameState.moveHistory.length;
  const viewedIndex =
    viewMoveIndex == null ? moveCount : Math.max(0, Math.min(viewMoveIndex, moveCount));
  const latestMove = viewedIndex > 0 ? (gameState.moveHistory[viewedIndex - 1] ?? null) : null;
  const latestSource = latestMove == null ? -1 : getMoveSource(latestMove);
  const latestTarget = latestMove == null ? -1 : getMoveTarget(latestMove);

  const selectedMoves =
    selectedSquare == null || pieces[selectedSquare] == null
      ? null
      : (movesByPieceAndSquare.get(`${pieces[selectedSquare]}-${selectedSquare}`) ?? null);

  const gameOver = gameState.gameOver || sideMoves.length === 0;
  const canMove =
    playerColor != null &&
    playerColor === gameState.side &&
    !gameOver &&
    atLatest &&
    viewedIndex === moveCount;

  const squares: SquareView[] = pieces.map((pieceId, key) => {
    const isWhitePiece = pieceId != null && gameState.whitePieceIds.includes(pieceId);
    const enginePiece = pieceId == null ? null : getPieceById(pieceId);
    const piece: PieceVisual | null =
      pieceId == null
        ? null
        : {
            id: pieceId,
            sprite: enginePiece?.getSprite() ?? {
              headKey: 'king-head',
              bodyKey: 'king-body',
              footKey: 'king-foot',
            },
            color: isWhitePiece ? 0 : 1,
            checked:
              enginePiece?.getKing() === true &&
              gameState.checked[isWhitePiece ? colors.WHITE : colors.BLACK] === true,
          };

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
      isLight: (Math.floor(key / BOARD_SIZE) + (key % BOARD_SIZE)) % 2 === 0,
      piece,
      moves:
        pieceId == null
          ? EMPTY_MOVE_LIST
          : (movesByPieceAndSquare.get(`${pieceId}-${key}`) ?? EMPTY_MOVE_LIST),
      highlight,
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
    result: gameState.result,
    canMove,
  };
}
