import { Piece, PieceFactory } from '~/game/piece/piece';
import { gameState, GameState } from '~/game/consts/board';

type SerializedPiece = {
  pieceType: string;
  id: number;
  color: number;
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
  pieces: SerializedPiece[];
  bitboards: SerializedBitboardData[];
  occupancies: string[];
  side: number;
  enpassant: number;
  castle: string;
  globalMove: number;
  nodes: number;
  whiteMoves: [number, number][];
  blackMoves: [number, number][];
};

/**
 * Serialize a game state to send to the server
 *
 * @param gs Game state
 */
export function serializeGameState(gs: GameState): SerializedGameState {
  /**
   * Serialize a piece.
   *
   * @param piece Piece to serialize.
   */
  function serializePiece(piece: Piece): SerializedPiece {
    let pieceType: string;
    if (piece instanceof Piece) {
      switch (piece.constructor.name) {
        case 'KingPiece':
          pieceType = 'king';
          break;
        case 'QueenPiece':
          pieceType = 'queen';
          break;
        case 'RookPiece':
          pieceType = 'rook';
          break;
        case 'BishopPiece':
          pieceType = 'bishop';
          break;
        case 'KnightPiece':
          pieceType = 'knight';
          break;
        case 'PawnPiece':
          pieceType = 'pawn';
          break;
        case 'BalloonPiece':
          pieceType = 'balloon';
          break;
        case 'PogoPiece':
          pieceType = 'pogo';
          break;
        default:
          throw new Error('Unknown Piece type');
      }
    } else {
      throw new Error('Invalid Piece instance');
    }

    return {
      pieceType,
      id: piece.getId(),
      color: piece.getColor(),
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

  const serialized = {
    whitePieceIds: gs.whitePieceIds,
    blackPieceIds: gs.blackPieceIds,
    pieces: gs.pieces.map(serializePiece),
    bitboards: gs.bitboards.map((bb) => ({
      pieceId: bb.pieceId,
      bitboard: bb.bitboard.toString(),
    })),
    occupancies: gs.occupancies.map((o) => o.toString()),
    side: gs.side,
    enpassant: gs.enpassant,
    castle: gs.castle.toString(),
    globalMove: gs.globalMove,
    nodes: gs.nodes,
    whiteMoves: Array.from(gs.whiteMoves.entries()),
    blackMoves: Array.from(gs.blackMoves.entries()),
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

    const piece =
      existing ?? PieceFactory.createPiece(serialized.pieceType, serialized.id, serialized.color);

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
    return piece;
  }

  const currentPieces = gameState?.pieces ?? [];

  return {
    whiteMoves: new Map(json.whiteMoves),
    blackMoves: new Map(json.blackMoves),
    whitePieceIds: json.whitePieceIds,
    blackPieceIds: json.blackPieceIds,
    pieces: json.pieces.map((p) => deserializePiece(p, currentPieces)),
    bitboards: json.bitboards.map((bb) => ({
      pieceId: bb.pieceId,
      bitboard: BigInt(bb.bitboard),
    })),
    occupancies: json.occupancies.map((o) => BigInt(o)),
    side: json.side,
    enpassant: json.enpassant,
    castle: BigInt(json.castle),
    globalMove: json.globalMove,
    nodes: json.nodes,
  };
}
