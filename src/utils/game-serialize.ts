import { Piece, PieceFactory } from '~/game/piece/piece';
import { GameState, gameState } from '~/game/consts/board';

type SerializedPiece = {
  pieceType: string;
  id: number;
  color: number;
  pieceMask: string[];
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
  function deserializePiece(serialized: SerializedPiece): Piece {
    const piece = PieceFactory.createPiece(serialized.pieceType, serialized.id, serialized.color);
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
    return piece;
  }

  return {
    whiteMoves: new Map(),
    blackMoves: new Map(),
    whitePieceIds: json.whitePieceIds,
    blackPieceIds: json.blackPieceIds,
    pieces: json.pieces.map(deserializePiece),
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
