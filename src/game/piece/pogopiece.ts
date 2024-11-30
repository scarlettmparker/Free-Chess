import { Piece } from "./piece";

export class PogoPiece extends Piece {
    id: number;
    color: number;
    reverse: Map<number, number>;

    constructor(id: number, color: number) {
        super(id, color);

        this.id = id;
        this.color = color;

        this.reverse = new Map<number, number>();
        this.leaper = true;
        this.rotationalMoveType = "REVERSE_ROTATE";

        this.leaperOffsets = [
            [[0, 2]], [[0, -1]],
            [[0, -2]], [[0, 1]]
        ];
    }

    setReverse = (reverse: Map<number, number>) => {
        this.reverse = reverse;
    }
}