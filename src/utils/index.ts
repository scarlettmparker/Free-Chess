import { colors, gameState } from '~/game/consts/board';
import { convertFEN, parseFEN } from '~/game/fen';
import {
  addPawn,
  addKnight,
  addBishop,
  addRook,
  addQueen,
  addKing,
  addPogoPiece,
  addBalloonPiece,
  addSpongebobPiece,
} from '~/game/init/add-piece';
import { resetGameState, initGameState, initGame } from '~/game/init/game';
import { pieceRegistry } from '~/game/piece/piece-registry';
import { PieceFactory } from '~/game/piece/piece-factory';
import type { PieceDefinition } from '~/game/piece/piece-definition';
import type { BoardPlacement } from '~/game/board/validate-layout';

const startPosition =
  '[7][3][5][9][11][5][3][7]/[1][1][1][1][1][1][1][1]/8/8/8/8/[0][0][0][0][0][0][0][0]/[6][2][4][8][10][4][2][6] w KQkq - 0 1';

/**
 * Layout Mounted When Reset Without An Explicit Board Choice.
 */
export type MountedLayout = {
  /**
   * Placements to mount.
   */
  placements: BoardPlacement[];
  /**
   * Definitions referenced by the placements.
   */
  definitions: PieceDefinition[];
};

/**
 * Convert placements into a piece id FEN board using engine ids.
 *
 * @param placements Placements to convert.
 * @returns FEN board string.
 */
function placementsToFenBoard(placements: BoardPlacement[]): string {
  const bySquare = new Map(placements.map((placement) => [placement.square, placement]));
  const ranks: string[] = [];
  for (let rank = 0; rank < 8; rank++) {
    let row = '';
    let empty = 0;
    for (let file = 0; file < 8; file++) {
      const placement = bySquare.get(rank * 8 + file);
      if (!placement) {
        empty++;
        continue;
      }
      if (empty > 0) {
        row += String(empty);
        empty = 0;
      }
      const engineId = pieceRegistry.getEngineId(placement.definitionId, placement.color);
      if (engineId === undefined) throw new Error('Placement refers to an unregistered piece');
      row += `[${engineId}]`;
    }
    if (empty > 0) row += String(empty);
    ranks.push(row);
  }
  return ranks.join('/');
}

/**
 * Reindex bitboards by engine id so positional lookups keep working when a
 * layout mounts a subset of pieces or definitions with sparse engine ids.
 */
function reindexBitboards(): void {
  if (gameState.pieces.length === 0) {
    gameState.bitboards = [];
    return;
  }
  const maxId = Math.max(...gameState.pieces.map((piece) => piece.getId()));
  const byId = new Map(gameState.bitboards.map((entry) => [entry.pieceId, entry]));
  gameState.bitboards = Array.from(
    { length: maxId + 1 },
    (_, id) => byId.get(id) ?? { pieceId: id, lo: 0, hi: 0 },
  );
}

/**
 * Mount pieces for every definition and colour present in the placements.
 *
 * @param placements Placements to mount.
 * @param definitions Definitions referenced by the placements.
 */
function mountPlacedPieces(placements: BoardPlacement[], definitions: PieceDefinition[]): void {
  const byId = new Map(definitions.map((definition) => [definition.id, definition]));
  const seen = new Set<string>();
  for (const placement of placements) {
    const key = `${placement.definitionId}:${placement.color}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const definition = byId.get(placement.definitionId);
    if (!definition) throw new Error('Placement refers to an unknown piece');
    let base = pieceRegistry.getEngineBaseId(definition.id);
    if (base === undefined) base = pieceRegistry.register(definition);
    const engineId = base + placement.color;
    const piece = definition.legacy
      ? PieceFactory.createPiece(definition.slug, engineId, placement.color)
      : PieceFactory.createGenericPiece(definition, engineId, placement.color);
    gameState.pieces.push(piece);
  }
}

/**
 * Helper function to mount the game state.
 *
 * @param layout Optional layout to mount instead of the standard position.
 */
export function mountGame(layout?: MountedLayout) {
  resetGameState();

  if (layout) {
    for (const definition of layout.definitions) {
      pieceRegistry.update(definition);
    }
    mountPlacedPieces(layout.placements, layout.definitions);
    initGameState();
    reindexBitboards();
    parseFEN(`${placementsToFenBoard(layout.placements)} w KQkq - 0 1`);
  } else {
    addPawn();
    addKnight();
    addBishop();
    addRook();
    addQueen();
    addKing();
    addPogoPiece();
    addBalloonPiece();
    addSpongebobPiece();
    initGameState();
    reindexBitboards();
    parseFEN(startPosition);
  }
  initGame();

  const kingFor = (color: number) =>
    gameState.pieces.find((piece) => {
      const definition = pieceRegistry.getDefinition(piece.getDefinitionId());
      return definition?.isKing && piece.getColor() === color;
    });
  gameState.kingPieceId = [
    kingFor(colors.WHITE)?.getId() ?? 10,
    kingFor(colors.BLACK)?.getId() ?? 11,
  ];
}

/**
 * Helper function.
 */
export function loadTestPosition(startPosition: string) {
  resetGameState();
  addPawn();
  addKnight();
  addBishop();
  addRook();
  addQueen();
  addKing();
  initGameState();
  parseFEN(convertFEN(startPosition));
  initGame();
}
