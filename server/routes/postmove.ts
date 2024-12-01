import { Router } from 'express';
import prisma from '../prismaclient';

const router = Router();

router.post('/', async (req, res) => {
    const { game, move } = req.body;
    //const post = prisma.
});

export default router;