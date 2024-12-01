import { Router } from 'express';
import prisma from '../prismaclient';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

const router = Router();

/**
 * Router for posting the game. If an error occurs with generating the game
 * ID, re-generate it and the chance of having a collision is essentially zero.
 */
router.post('/', async (req, res) => {
    let length = 8;
    let game = makeID(length);
    let post;

    try {
        post = await postGame(game);
        res.status(200).json(post);
    } catch (error) {
        if (error instanceof PrismaClientKnownRequestError && (error.meta!.target as string[])[0] == "game") {
            game = makeID(length + 1);
            post = await postGame(game);
            res.status(200).json(post); // assume it has worked
        } else {
            res.status(500).json({ error: "An unknown error has occured." });
        }
    }
});

/**
 * Post the game to the database using prisma.
 * @param game Game ID (for finding the game for spectators and players).
 */
async function postGame(game: string) {
    return prisma.chessGame.create({
        data: {
            game: game
        }
    });
}

/**
 * Function to make a random game ID (string with number/letters of length: length).
 * @param length Length of the game ID.
 */
function makeID(length: number) {
    let result = '';
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890";

    let counter = 0;
    while (counter < length) {
        result += chars.charAt(Math.random() * chars.length);
        counter += 1;
    }

    return result;
}

export default router;