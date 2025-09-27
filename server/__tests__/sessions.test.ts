import {
  sessions,
  colorMap,
  createSession,
  chooseColorForReattach,
  assignColor,
  clearColor,
} from '~server/sessions';

describe('sessions module', () => {
  beforeEach(() => {
    sessions.clear();
    colorMap.clear();
  });

  test('createSession prefers white then black when no requestedColor', () => {
    const a = createSession(null);
    expect(a.color).toBe('white');
    const b = createSession(null);
    expect(b.color).toBe('black');
    const c = createSession(null);
    expect(c.color).toBeNull();
  });

  test('createSession honors requestedColor if free', () => {
    const a = createSession('black');
    expect(a.color).toBe('black');
  });

  test('chooseColorForReattach uses requestedColor if free or already assigned', () => {
    // create session and assign white
    const s = createSession(null);
    const sid = s.sessionId;
    // simulate stored session exists
    expect(sessions.has(sid)).toBe(true);

    // request reattach with white when white is already assigned to this session
    const chosen = chooseColorForReattach(sid, 'white');
    expect(chosen).toBe('white');
  });

  test('chooseColorForReattach rejects when requestedColor taken by another', () => {
    createSession('white');
    const s2 = createSession(null);
    // attempt to reattach s2 with requested white should fail
    const chosen = chooseColorForReattach(s2.sessionId, 'white');
    expect(chosen).toBeNull();
  });

  test('assignColor fails when taken by other session', () => {
    createSession('white');
    const s2 = createSession(null);
    const ok = assignColor(s2.sessionId, 'white');
    expect(ok).toBe(false);
  });

  test('clearColor clears mapping but keeps session', () => {
    const s1 = createSession('black');
    const sid = s1.sessionId;
    expect(colorMap.has('black')).toBe(true);
    const ok = clearColor('black');
    expect(ok).toBe(true);
    expect(colorMap.has('black')).toBe(false);
    expect(sessions.get(sid)?.color).toBeNull();
  });
});
