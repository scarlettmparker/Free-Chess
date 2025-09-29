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
    (promoted << 20) |
    (capture << 28) |
    (double << 29) |
    (enpassant << 30) |
    (castling << 31)
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
  return (move >> 20) & 0xff;
}

export function getMoveCapture(move: number): number {
  return (move >> 28) & 0x1;
}

export function getMoveDouble(move: number): number {
  return (move >> 29) & 0x1;
}

export function getMoveEnpassant(move: number): number {
  return (move >> 30) & 0x1;
}

export function getMoveCastle(move: number): number {
  return (move >> 31) & 0x1;
}
