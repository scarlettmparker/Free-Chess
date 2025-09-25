import { Piece } from './piece';

export class BalloonPiece extends Piece {
  id: number;
  color: number;
  reverse: Map<number, number>;

  constructor(id: number, color: number) {
    super(id, color);

    this.id = id;
    this.color = color;

    this.reverse = new Map<number, number>();
    this.leaper = true;
    this.rotationalMoveType = 'ROTATE';

    this.leaperOffsets = [
      [
        [0, 2],
        [0, -2],
        [1, 1],
        [1, -1],
        [-1, 1],
        [-1, -1],
      ], // move 1

      [
        [0, 2],
        [0, -2],
        [1, 2],
        [1, -2],
        [2, 1],
        [2, -1],
        [-1, 2],
        [-1, -2],
        [-2, 1],
        [-2, -1],
      ], // move 2
    ];
  }

  setReverse = (reverse: Map<number, number>) => {
    this.reverse = reverse;
  };
}
