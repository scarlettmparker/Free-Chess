import { Piece } from "./piece";

export class Rook extends Piece {
    id: number;
    color: number;

    constructor(id: number, color: number) {
        super(id, color);

        this.id = id;
        this.color = color;

        this.slider = true;
        this.straight = true;

        this.straightConstraints = [8, 8, 8, 8];
    }
}