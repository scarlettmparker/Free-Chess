import { Piece } from "./piece";

export class King extends Piece {
    id: number;
    color: number;

    constructor(id: number, color: number) {
        super(id, color);

        this.id = id;
        this.color = color;

        this.leaper = true;
        this.leaperOffsets = [
            [[-1, 1], [0, 1], [1, 1], [-1, 0],
            [1, 0], [-1, -1], [0, -1], [1, -1]]
        ];
    }
}