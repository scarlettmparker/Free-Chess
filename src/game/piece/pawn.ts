import { Piece } from './piece';

export class Pawn extends Piece {
  id: number;
  color: number;

  constructor(id: number, color: number) {
    super(id, color);

    this.id = id;
    this.color = color;

    this.pawn = true;
    this.enpassant = true;
    this.promote = true;
  }
}
