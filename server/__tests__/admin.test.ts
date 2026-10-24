import { isAdminAuthorized, runCommand } from '~server/admin';
import { colorMap, createSession, sessions } from '~server/sessions';

describe('admin module', () => {
  beforeEach(() => {
    sessions.clear();
    colorMap.clear();
  });

  test('requires the configured bearer token', () => {
    expect(isAdminAuthorized(null, '')).toBe(true);
    expect(isAdminAuthorized('Bearer secret', 'secret')).toBe(true);
    expect(isAdminAuthorized('Bearer wrong', 'secret')).toBe(false);
    expect(isAdminAuthorized(null, 'secret')).toBe(false);
    expect(isAdminAuthorized('secret', 'secret')).toBe(false);
  });

  test('lists sessions with their current state', () => {
    const first = createSession('white');
    const second = createSession('black');

    const result = runCommand('list');

    expect(result.ok).toBe(true);
    expect(result.sessions).toEqual([
      expect.objectContaining({
        sessionId: first.sessionId,
        color: 'white',
        connected: false,
      }),
      expect.objectContaining({
        sessionId: second.sessionId,
        color: 'black',
        connected: false,
      }),
    ]);
  });

  test('clears a single colour and reports a no-op', () => {
    createSession('white');

    expect(runCommand('cw')).toMatchObject({ ok: true, message: 'Cleared white' });
    expect(runCommand('cw')).toMatchObject({
      ok: false,
      message: 'No session for color white',
    });
  });

  test('clears both colours', () => {
    createSession('white');
    createSession('black');

    expect(runCommand('clear')).toMatchObject({ ok: true, message: 'Cleared white black' });
    expect(runCommand('clear')).toMatchObject({ ok: false, message: 'No colours to clear' });
  });

  test('resets the game and broadcasts the new state', () => {
    const broadcast = vi.fn();

    const result = runCommand('reset', broadcast);

    expect(result.ok).toBe(true);
    expect(broadcast).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'state',
        state: expect.any(Object),
      }),
    );
  });

  test('rejects unknown commands', () => {
    expect(runCommand('nope')).toMatchObject({ ok: false });
  });
});
