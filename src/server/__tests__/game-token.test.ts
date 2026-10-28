import { describe, expect, it } from 'vitest';
import { createGameToken, verifyGameToken } from '~/server/game-token';

const secret = 'test-secret';
const now = Date.UTC(2026, 0, 1);

describe('game tokens', () => {
  it('round trips valid claims', () => {
    const token = createGameToken(
      { gameId: 'Ab3dE9f', accountId: 'account-1' },
      secret,
      now,
      60_000,
    );

    expect(verifyGameToken(token, secret, now)).toEqual({
      gameId: 'Ab3dE9f',
      accountId: 'account-1',
      exp: now + 60_000,
    });
  });

  it('rejects tampered tokens', () => {
    const token = createGameToken(
      { gameId: 'Ab3dE9f', accountId: 'account-1' },
      secret,
      now,
      60_000,
    );
    const tampered = `${token.slice(0, -1)}x`;

    expect(verifyGameToken(tampered, secret, now)).toBeNull();
  });

  it('rejects expired tokens', () => {
    const token = createGameToken(
      { gameId: 'Ab3dE9f', accountId: 'account-1' },
      secret,
      now,
      60_000,
    );

    expect(verifyGameToken(token, secret, now + 60_001)).toBeNull();
  });

  it('rejects tokens for another game', () => {
    const token = createGameToken(
      { gameId: 'Ab3dE9f', accountId: 'account-1' },
      secret,
      now,
      60_000,
    );

    expect(verifyGameToken(token, secret, now, 'Zz9zZ9z')).toBeNull();
    expect(verifyGameToken(token, secret, now, 'Ab3dE9f')).not.toBeNull();
  });

  it('rejects tokens without a secret', () => {
    const token = createGameToken(
      { gameId: 'Ab3dE9f', accountId: 'account-1' },
      secret,
      now,
      60_000,
    );

    expect(verifyGameToken(token, '', now)).toBeNull();
  });
});
