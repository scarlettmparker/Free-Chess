import { Piece } from './piece';

export class Bishop extends Piece {
  id: number;
  color: number;

  constructor(id: number, color: number) {
    super(id, color);

    this.id = id;
    this.color = color;

    this.slider = true;
    this.diagonal = true;

    this.diagonalConstraints = [8, 8, 8, 8];
  }
}
