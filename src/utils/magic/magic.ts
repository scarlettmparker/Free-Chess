import { getRandomU64Number } from "./random";

/**
 * Generates a magic number candidate.
 * @returns Magic number candidate.
 */
export const generateMagicNumber = () => {
    return getRandomU64Number() & getRandomU64Number() & getRandomU64Number();
}

export default null;