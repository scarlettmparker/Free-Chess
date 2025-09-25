export interface MoveList {
  moves: number[];
  count: number;
}

export const promotedPieces = ['', 'q', 'r', 'b', 'n', '', '', 'q', 'r', 'b', 'n'];

export function encodeMove(
  source: number,
  target: number,
  piece: number,
  promoted: number,
  capture: number,
  double: number,
  enpassant: number,
  castling: number,
): number {
  return (
    source |
    (target << 6) |
    (piece << 12) |
    (promoted << 16) |
    (capture << 20) |
    (double << 21) |
    (enpassant << 22) |
    (castling << 23)
  );
}

export function getMoveSource(move: number): number {
  return move & 0x3f;
}

export function getMoveTarget(move: number): number {
  return (move & 0xfc0) >> 6;
}

export function getMovePiece(move: number): number {
  return (move >> 12) & 0xff;
}

export function getMovePromoted(move: number): number {
  return (move & 0xf0000) >> 16;
}

export function getMoveCapture(move: number): number {
  return move & 0x100000;
}

export function getMoveDouble(move: number): number {
  return move & 0x200000;
}

export function getMoveEnpassant(move: number): number {
  return move & 0x400000;
}

export function getMoveCastle(move: number): number {
  return move & 0x800000;
}

export default null;
