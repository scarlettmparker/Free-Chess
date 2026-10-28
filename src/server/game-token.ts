import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Claims carried by a signed game socket token.
 */
export type GameTokenPayload = {
  /**
   * Game the token may connect to.
   */
  gameId: string;
  /**
   * Account the token represents.
   */
  accountId: string;
  /**
   * Expiry timestamp in milliseconds.
   */
  exp: number;
};

/**
 * Lifetime of a signed game socket token.
 */
export const GAME_TOKEN_TTL_MS = 2 * 60 * 60 * 1000;

/**
 * Builds the signature for an encoded token payload.
 *
 * @param encoded Encoded payload.
 * @param secret Signing secret.
 * @returns Base64url signature.
 */
function signPayload(encoded: string, secret: string): string {
  return createHmac('sha256', secret).update(encoded).digest('base64url');
}

/**
 * Creates a signed token for a game socket.
 *
 * @param input Game and account identifiers.
 * @param secret Signing secret.
 * @param now Current time in milliseconds.
 * @param ttlMs Token lifetime in milliseconds.
 * @returns Signed token.
 */
export function createGameToken(
  input: Pick<GameTokenPayload, 'gameId' | 'accountId'>,
  secret: string,
  now = Date.now(),
  ttlMs = GAME_TOKEN_TTL_MS,
): string {
  const payload: GameTokenPayload = {
    gameId: input.gameId,
    accountId: input.accountId,
    exp: now + ttlMs,
  };
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  return `${encoded}.${signPayload(encoded, secret)}`;
}

/**
 * Reads a signed game socket token.
 *
 * @param token Token to read.
 * @param secret Signing secret.
 * @param now Current time in milliseconds.
 * @param expectedGameId Game the token must belong to.
 * @returns Token claims, or null when the token is invalid or expired.
 */
export function verifyGameToken(
  token: string,
  secret: string,
  now = Date.now(),
  expectedGameId?: string,
): GameTokenPayload | null {
  if (!secret) return null;

  const separator = token.lastIndexOf('.');
  if (separator <= 0) return null;

  const encoded = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  const expected = signPayload(encoded, secret);

  const actualBuffer = Buffer.from(signature, 'utf8');
  const expectedBuffer = Buffer.from(expected, 'utf8');
  if (
    actualBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== 'object') return null;

  const payload = parsed as Partial<GameTokenPayload>;
  if (
    typeof payload.gameId !== 'string' ||
    typeof payload.accountId !== 'string' ||
    typeof payload.exp !== 'number' ||
    !Number.isFinite(payload.exp) ||
    payload.exp <= now
  ) {
    return null;
  }

  if (expectedGameId !== undefined && payload.gameId !== expectedGameId) {
    return null;
  }

  return {
    gameId: payload.gameId,
    accountId: payload.accountId,
    exp: payload.exp,
  };
}
