import { getPieceById } from '~/game/board/bitboard';
import { colors, gameState, moveType } from '~/game/consts/board';
import { generateMoves } from '~/game/move/legal-move-generator';
import { isLegalMove, makeMove } from '~/game/move/move';
import { getMoveSource, getMoveTarget } from '~/game/move/move-def';
import { mountGame } from '~/utils';
import { buildBoardView } from '~/utils/game-view';

describe('buildBoardView', () => {
  beforeEach(() => {
    mountGame();
    gameState.moveHistory = [];
  });

  test('snapshots the starting position', () => {
    const view = buildBoardView(null, colors.WHITE);

    expect(view.squares).toHaveLength(64);
    expect(view.squares.filter((square) => square.piece != null)).toHaveLength(32);
    expect(view.side).toBe(colors.WHITE);
    expect(view.orientation).toBe('white');
    expect(view.canMove).toBe(true);
    expect(view.gameOver).toBe(false);
  });

  test('spectators cannot move', () => {
    expect(buildBoardView(null, null).canMove).toBe(false);
  });

  test('black players see the board from black', () => {
    expect(buildBoardView(null, colors.BLACK).orientation).toBe('black');
  });

  test('selecting a piece marks it and its targets', () => {
    const initial = buildBoardView(null, colors.WHITE);
    const source = initial.squares.find((square) => square.selectable);
    expect(source).toBeDefined();

    const selected = buildBoardView(source!.key, colors.WHITE);

    expect(selected.squares[source!.key].highlight).toBe('selected');
    expect(
      selected.squares.filter((square) => square.highlight === 'target').length,
    ).toBeGreaterThan(0);
  });

  test('opponent pieces are not selectable', () => {
    const view = buildBoardView(null, colors.WHITE);
    const blackPiece = view.squares.find(
      (square) => square.piece != null && gameState.blackPieceIds.includes(square.piece.id),
    );

    expect(blackPiece).toBeDefined();
    expect(blackPiece!.selectable).toBe(false);
  });

  test('the latest move is highlighted', () => {
    const candidates = { moves: [] as number[], count: 0 };
    generateMoves(candidates, gameState.pieces);
    const move = candidates.moves.find((candidate) => isLegalMove(candidate))!;

    expect(makeMove(move, moveType.ALL_MOVES, 0)).toBe(1);
    gameState.moveHistory.push(move);

    const view = buildBoardView(null, colors.BLACK);

    expect(view.squares[getMoveSource(move)].highlight).toBe('latest');
    expect(view.squares[getMoveTarget(move)].highlight).toBe('latest');
  });

  test('cannot move while viewing an earlier position', () => {
    const historical = buildBoardView(null, colors.WHITE, 0, false);
    const live = buildBoardView(null, colors.WHITE, 0, true);

    expect(historical.canMove).toBe(false);
    expect(live.canMove).toBe(true);
  });

  test('flags the checked king', () => {
    const view = buildBoardView(null, colors.WHITE);
    const king = view.squares.find(
      (square) =>
        square.piece != null &&
        gameState.whitePieceIds.includes(square.piece.id) &&
        getPieceById(square.piece.id)?.getKing(),
    );
    expect(king).toBeDefined();

    gameState.checked = [true, false];
    const checkedView = buildBoardView(null, colors.WHITE);

    expect(checkedView.squares[king!.key].piece?.checked).toBe(true);
  });
});
