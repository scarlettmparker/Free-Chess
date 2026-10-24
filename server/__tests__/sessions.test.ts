import {
  sessions,
  colorMap,
  attachSession,
  createSession,
  chooseColorForReattach,
  assignColor,
  clearColor,
  detachSession,
} from '~server/sessions';

function fakeSocket() {
  return { send: vi.fn(), close: vi.fn() };
}

describe('sessions module', () => {
  beforeEach(() => {
    sessions.clear();
    colorMap.clear();
  });

  test('createSession prefers white then black when no requestedColor', () => {
    const a = createSession(null, fakeSocket());
    expect(a.color).toBe('white');
    const b = createSession(null, fakeSocket());
    expect(b.color).toBe('black');
    const c = createSession(null, fakeSocket());
    expect(c.color).toBeNull();
  });

  test('createSession honors requestedColor if free', () => {
    const a = createSession('black', fakeSocket());
    expect(a.color).toBe('black');
  });

  test('chooseColorForReattach uses requestedColor if free or already assigned', () => {
    const s = createSession(null, fakeSocket());
    const sid = s.sessionId;
    expect(sessions.has(sid)).toBe(true);

    const chosen = chooseColorForReattach(sid, 'white');
    expect(chosen).toBe('white');
  });

  test('chooseColorForReattach rejects when requestedColor taken by another', () => {
    createSession('white', fakeSocket());
    const s2 = createSession(null, fakeSocket());
    const chosen = chooseColorForReattach(s2.sessionId, 'white');
    expect(chosen).toBeNull();
  });

  test('assignColor fails when taken by other session', () => {
    createSession('white', fakeSocket());
    const s2 = createSession(null, fakeSocket());
    const ok = assignColor(s2.sessionId, 'white');
    expect(ok).toBe(false);
  });

  test('clearColor evicts the session and frees the mapping', () => {
    const socket = fakeSocket();
    const s1 = createSession('black', socket);
    const sid = s1.sessionId;
    expect(colorMap.has('black')).toBe(true);

    const ok = clearColor('black');
    expect(ok).toBe(true);
    expect(colorMap.has('black')).toBe(false);
    expect(sessions.has(sid)).toBe(false);
    expect(socket.close).toHaveBeenCalledWith(4003, 'color-cleared');
  });

  test('detachSession starts the grace period and ignores replaced sockets', () => {
    const first = fakeSocket();
    const second = fakeSocket();
    const s = createSession('white', first);

    expect(detachSession(s.sessionId, first, 1000)).toBe(true);
    expect(sessions.get(s.sessionId)?.ws).toBeUndefined();
    expect(sessions.get(s.sessionId)?.disconnectedAt).toBe(1000);

    attachSession(s.sessionId, 'white', second, { now: 2000, graceMs: 5000 });
    expect(detachSession(s.sessionId, first, 3000)).toBe(false);
    expect(sessions.get(s.sessionId)?.ws).toBe(second);
  });

  test('detachSession drops spectator sessions immediately', () => {
    createSession('white', fakeSocket());
    createSession('black', fakeSocket());
    const spectator = createSession(null, fakeSocket());

    detachSession(spectator.sessionId, undefined, 1000);
    expect(sessions.has(spectator.sessionId)).toBe(false);
  });

  test('a new connection reclaims a colour after the reconnect grace', () => {
    const old = createSession('white', fakeSocket());
    detachSession(old.sessionId, undefined, 1000);

    const rejected = attachSession(null, 'white', fakeSocket(), { now: 3000, graceMs: 5000 });
    expect(rejected.status).toBe('rejected');

    const taken = attachSession(null, 'white', fakeSocket(), { now: 7000, graceMs: 5000 });
    if (taken.status !== 'accepted') throw new Error('expected accepted session');
    expect(taken.color).toBe('white');
    expect(sessions.has(old.sessionId)).toBe(false);
  });

  test('a stored session restores its colour after a long disconnect', () => {
    const stored = createSession('black', fakeSocket());
    detachSession(stored.sessionId, undefined, 1000);

    const restored = attachSession(stored.sessionId, null, fakeSocket(), {
      now: 60_000,
      graceMs: 5000,
    });
    expect(restored).toEqual({
      status: 'restored',
      sessionId: stored.sessionId,
      color: 'black',
    });
  });

  test('a reattaching session does not report a colour owned by another session', () => {
    const old = createSession('white', fakeSocket());
    const other = createSession(null, fakeSocket());

    // Simulate the colour moving to another session without deleting `old`.
    colorMap.set('white', other.sessionId);

    const restored = attachSession(old.sessionId, null, fakeSocket(), {
      now: 8000,
      graceMs: 5000,
    });
    if (restored.status !== 'restored') throw new Error('expected restored session');
    expect(restored.color).toBeNull();
  });

  test('attachSession restores a known session and rejects a taken colour', () => {
    const stored = createSession('black', fakeSocket());

    const restored = attachSession(stored.sessionId, 'black', fakeSocket());
    expect(restored).toEqual({
      status: 'restored',
      sessionId: stored.sessionId,
      color: 'black',
    });

    const rejected = attachSession(null, 'black', fakeSocket());
    expect(rejected).toEqual({ status: 'rejected', reason: 'color-taken' });
  });

  test('attachSession replaces a live socket for the same session', () => {
    const first = fakeSocket();
    const second = fakeSocket();
    const s = createSession('white', first);

    const result = attachSession(s.sessionId, 'white', second);
    expect(result.status).toBe('restored');
    expect(first.close).toHaveBeenCalledWith(4001, 'session-replaced');
    expect(sessions.get(s.sessionId)?.ws).toBe(second);
  });
});
