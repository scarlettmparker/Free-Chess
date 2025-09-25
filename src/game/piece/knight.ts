import { Piece } from './piece';

export class Knight extends Piece {
  id: number;
  color: number;

  constructor(id: number, color: number) {
    super(id, color);

    this.id = id;
    this.color = color;

    this.leaper = true;
    this.leaperOffsets = [
      [
        [-2, 1],
        [-1, 2],
        [1, 2],
        [2, 1],
        [-2, -1],
        [-1, -2],
        [1, -2],
        [2, -1],
      ],
    ];
  }
}
