import {
  LeaperMoveBehavior,
  PawnMoveBehavior,
  Piece,
  SlidingMoveBehavior,
} from '~/game/piece/piece';
import { PieceFactory } from '~/game/piece/piece-factory';
import type { PieceDefinition } from '~/game/piece/piece-definition';
import { pieceRegistry } from '~/game/piece/piece-registry';
import { initSlidingPieces } from '~/game/init/sliding-piece';
import { gameState, GameState, GameResult, Moves } from '~/game/consts/board';

type SerializedPiece = {
  pieceType: string;
  id: number;
  definitionId: number;
  definition: PieceDefinition | null;
  color: number;
  sprite: { headKey: string; bodyKey: string; footKey: string };
  pieceMask: string[];
  move: number;
  globalEffect: boolean;
  firstMove: number;
  king: boolean;
  pawn: boolean;
  enpassant: boolean;
  promote: boolean;
  slider: boolean;
  leaper: boolean;
  rotationalMoveType: string;
  reverse: [number, number][];
};

type SerializedBitboardData = {
  pieceId: number;
  bitboard: string;
};

export type SerializedGameState = {
  whitePieceIds: number[];
  blackPieceIds: number[];
  kingPieceId: [number, number];
  pieces: SerializedPiece[];
  bitboards: SerializedBitboardData[];
  occupancies: string[];
  checked: [boolean, boolean];
  gameOver: boolean;
  result: GameResult;
  side: number;
  enpassant: number;
  castle: string;
  globalMove: number;
  nodes: number;
  moves: Moves;
  whiteMoves: [number, number][];
  blackMoves: [number, number][];
  moveHistory: number[];
};

/**
 * Serialize a game state to send to the server
 *
 * @param gs Game state
 * @param latestMove Latest move
 */
export function serializeGameState(gs: GameState): SerializedGameState {
  /**
   * Serialize a piece.
   *
   * @param piece Piece to serialize.
   */
  function serializePiece(piece: Piece): SerializedPiece {
    if (!(piece instanceof Piece)) {
      throw new Error('Invalid Piece instance');
    }

    const pieceType = piece.getType();
    if (!pieceType) {
      throw new Error('Unknown Piece type');
    }

    const stored = pieceRegistry.getDefinition(piece.getDefinitionId());
    const definition = stored ? { ...stored } : null;
    if (definition) {
      delete definition.legacy;
    }

    return {
      pieceType,
      id: piece.getId(),
      definitionId: piece.getDefinitionId(),
      definition: definition as PieceDefinition | null,
      color: piece.getColor(),
      sprite: piece.getSprite(),
      pieceMask: Array.from(piece.getPieceMask()).map((b) => b.toString()),
      move: piece.getMove(),
      globalEffect: piece.getGlobalEffect(),
      firstMove: piece.getFirstMove(),
      king: piece.getKing(),
      pawn: piece.getPawn(),
      enpassant: piece.getEnpassant(),
      promote: piece.getPromote(),
      slider: piece.getSlider(),
      leaper: piece.getLeaper(),
      rotationalMoveType: piece.getRotationalMoveType(),
      reverse: Array.from(piece.getReverse().entries()),
    };
  }

  const serialized: SerializedGameState = {
    whitePieceIds: [...gs.whitePieceIds],
    blackPieceIds: [...gs.blackPieceIds],
    kingPieceId: [gs.kingPieceId[0], gs.kingPieceId[1]],
    pieces: gs.pieces.map(serializePiece),
    bitboards: gs.bitboards.map((bb) => ({
      pieceId: bb.pieceId,
      bitboard: ((BigInt(bb.hi >>> 0) << 32n) | BigInt(bb.lo >>> 0)).toString(),
    })),
    occupancies: [0, 1, 2].map((i) =>
      ((BigInt(gs.occHi[i]) << 32n) | BigInt(gs.occLo[i])).toString(),
    ),
    checked: [...gs.checked],
    gameOver: gs.gameOver,
    result: gs.result,
    side: gs.side,
    enpassant: gs.enpassant,
    castle: gs.castle.toString(),
    globalMove: gs.globalMove,
    nodes: gs.nodes,
    moves: { ...gs.moves },
    whiteMoves: Array.from(gs.whiteMoves.entries()),
    blackMoves: Array.from(gs.blackMoves.entries()),
    moveHistory: [...gs.moveHistory],
  };
  return serialized;
}

/**
 * Deserialize a game state to process on client side.
 *
 * @param json Serialized game state.
 */
export function deserializeGameState(json: SerializedGameState): GameState {
  /**
   * Deserialize a piece.
   *
   * @param serialized Serialized piece.
   */
  function deserializePiece(serialized: SerializedPiece, currentPieces: Piece[]): Piece {
    const existing = currentPieces.find((p) => p.getId() === serialized.id);

    if (serialized.definition) {
      pieceRegistry.update(serialized.definition);
    }

    const piece =
      existing ??
      (serialized.definition
        ? PieceFactory.createGenericPiece(serialized.definition, serialized.id, serialized.color)
        : PieceFactory.createPiece(serialized.pieceType, serialized.id, serialized.color));

    // Reassign attributes (don’t recreate attacks)
    piece.setPieceMask(
      new BigUint64Array(
        serialized.pieceMask.map((s) => {
          try {
            return BigInt(s);
          } catch (e) {
            console.error('Failed to convert to BigInt:', s, e);
            throw e;
          }
        }),
      ),
    );
    piece.setMove(serialized.move);
    piece.setGlobalEffect(serialized.globalEffect);
    piece.setFirstMove(serialized.firstMove);
    piece.setKing(serialized.king);
    piece.setPawn(serialized.pawn);
    piece.setEnpassant(serialized.enpassant);
    piece.setPromote(serialized.promote);
    piece.setSlider(serialized.slider);
    piece.setLeaper(serialized.leaper);
    piece.setRotationalMoveType(serialized.rotationalMoveType);
    piece.setReverse(new Map(serialized.reverse));
    piece.setDefinitionId(serialized.definitionId);
    if (serialized.sprite) {
      piece.setSprite(serialized.sprite);
    }
    return piece;
  }

  const currentPieces = gameState?.pieces ?? [];

  const gs: GameState = {
    whiteMoves: new Map(json.whiteMoves),
    blackMoves: new Map(json.blackMoves),
    whitePieceIds: [...json.whitePieceIds],
    blackPieceIds: [...json.blackPieceIds],
    pieces: json.pieces.map((p) => deserializePiece(p, currentPieces)),
    kingPieceId: [
      json.kingPieceId?.[0] ?? 10,
      json.kingPieceId?.[1] ?? 11,
    ] as [number, number],
    bitboards: json.bitboards.map((bb) => {
      const v = BigInt(bb.bitboard);
      return {
        pieceId: bb.pieceId,
        lo: Number(v & 0xffffffffn) >>> 0,
        hi: Number(v >> 32n) >>> 0,
      };
    }),
    occLo: Uint32Array.from(json.occupancies.map((o) => Number(BigInt(o) & 0xffffffffn) >>> 0)),
    occHi: Uint32Array.from(json.occupancies.map((o) => Number(BigInt(o) >> 32n) >>> 0)),
    checked: [...json.checked],
    gameOver: Boolean(json.gameOver),
    result: json.result ?? null,
    side: json.side,
    enpassant: json.enpassant,
    castle: Number(json.castle),
    globalMove: json.globalMove,
    moves: { ...json.moves },
    nodes: json.nodes,
    moveHistory: [...json.moveHistory],
  };

  const { straightLo, straightHi, straightBits, diagonalLo, diagonalHi, diagonalBits } =
    initSlidingPieces();
  for (const piece of gs.pieces) {
    const behavior = piece.getMoveBehavior();
    if (behavior instanceof SlidingMoveBehavior) {
      if (behavior.getStraight()) {
        behavior.setStraightAttackTables(straightLo, straightHi, straightBits);
      }
      if (behavior.getDiagonal()) {
        behavior.setDiagonalAttackTables(diagonalLo, diagonalHi, diagonalBits);
      }
    } else if (behavior instanceof LeaperMoveBehavior || behavior instanceof PawnMoveBehavior) {
      behavior.initializeAttacks();
    }
  }

  return gs;
}
