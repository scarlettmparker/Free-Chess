let randomState = 1804289383n;

/**
 * Generate 64-bit pseudo legal numbers.
 * @returns Random U64 number.
 */
export const getRandomU64Number = () => {
    let n1, n2, n3, n4;

    // init random numbers, slice 16 bits from ms1b side
    n1 = getRandomU32Number() & 0xFFFFn;
    n2 = getRandomU32Number() & 0xFFFFn;
    n3 = getRandomU32Number() & 0xFFFFn;
    n4 = getRandomU32Number() & 0xFFFFn;

    return n1 | (n2 << 16n) | (n3 << 32n) | (n4 << 48n);
}

/**
 * 
 * @returns Random U32 number (big int masked with U32).
 */
export const getRandomU32Number = () => {
    let number = randomState;

    // XOR shift algorithm
    number ^= number << 13n;
    number ^= number >> 17n;
    number ^= number << 5n;

    randomState = number;
    return number & 0xFFFFFFFFn;
}

export default null;