/**
 * Lightweight in-memory session store and helpers.
 */

export type Color = 'white' | 'black' | null;

export type Socket = {
  /**
   * Sends a JSON string to the client.
   */
  send(data: string): unknown;
  /**
   * Closes the connection.
   */
  close(code?: number, reason?: string): void;
};

export type Session = {
  /**
   * Colour held by this session, or null for a spectator.
   */
  color: Color;
  /**
   * Live socket, or undefined while disconnected.
   */
  ws?: Socket;
  /**
   * When the socket last dropped. Used to decide whether a new connection can
   * reclaim the colour.
   */
  disconnectedAt?: number | null;
};

/**
 * How long a disconnected session keeps its colour before another connection
 * may reclaim it.
 */
export const DEFAULT_RECONNECT_GRACE_MS = 5_000;

// sessionId -> Session
export const sessions: Map<string, Session> = new Map();
// color -> sessionId
export const colorMap: Map<NonNullable<Color>, string> = new Map();

/**
 * Generate a short random id.
 */
export function makeId(): string {
  return Math.random().toString(36).slice(2, 10);
}

/**
 * Decide which color should be assigned to a reattaching session.
 * Priority:
 * 1) requestedColor if provided and free (or already assigned to this session)
 * 2) existing session color if set
 * 3) prefer white if free, then black
 *
 * Returns the chosen color or null.
 */
export function chooseColorForReattach(
  sessionId: string,
  requestedColor: Color | undefined,
): Color {
  const sess = sessions.get(sessionId);
  if (!sess) return null;

  // A colour can be reclaimed by a newer session after the grace period.
  if (sess.color && colorMap.get(sess.color) !== sessionId) {
    sess.color = null;
  }

  let desiredColor: Color = null;
  if (requestedColor) desiredColor = requestedColor;
  else if (sess.color) desiredColor = sess.color;
  else if (!colorMap.has('white')) desiredColor = 'white';
  else if (!colorMap.has('black')) desiredColor = 'black';

  // If desiredColor is taken by another session, reject (return null)
  if (desiredColor) {
    const takenBy = colorMap.get(desiredColor);
    if (takenBy && takenBy !== sessionId) return null;
    // assign
    if (sess.color && sess.color !== desiredColor) {
      colorMap.delete(sess.color);
    }
    sess.color = desiredColor;
    colorMap.set(desiredColor, sessionId);
    return desiredColor;
  }

  return null;
}

/**
 * Create a new session. If requestedColor is provided and free it will be used.
 * Otherwise prefer white, then black, otherwise null.
 */
export function createSession(
  requestedColor: Color | undefined,
  ws?: Socket,
): { sessionId: string; color: Color } {
  let chosenColor: Color = null;
  if (requestedColor && !colorMap.has(requestedColor as NonNullable<Color>)) {
    chosenColor = requestedColor as Color;
  } else if (!colorMap.has('white')) chosenColor = 'white';
  else if (!colorMap.has('black')) chosenColor = 'black';
  else chosenColor = null;

  const newSessionId = makeId();
  sessions.set(newSessionId, { color: chosenColor, ws, disconnectedAt: null });
  if (chosenColor) colorMap.set(chosenColor, newSessionId);

  return { sessionId: newSessionId, color: chosenColor };
}

/**
 * Assign a color to an existing session. Returns true on success, false if taken by another session.
 */
export function assignColor(sessionId: string, color: NonNullable<Color>): boolean {
  const taken = colorMap.get(color);
  if (taken && taken !== sessionId) return false;
  const sess = sessions.get(sessionId);
  if (!sess) return false;
  if (sess.color && sess.color !== color) colorMap.delete(sess.color);
  sess.color = color;
  colorMap.set(color, sessionId);
  return true;
}

/**
 * Point a session at a new socket, replacing any previous connection.
 */
function replaceSocket(sess: Session, ws: Socket) {
  if (sess.ws && sess.ws !== ws) {
    try {
      sess.ws.close(4001, 'session-replaced');
    } catch {
      // ignore
    }
  }
  sess.ws = ws;
  sess.disconnectedAt = null;
}

/**
 * Release a colour whose holder has been disconnected for longer than the
 * grace period. A live or recently dropped session keeps it.
 */
function releaseStaleColor(
  color: NonNullable<Color>,
  now: number,
  graceMs: number,
  keepSessionId: string | null,
): boolean {
  const sessionId = colorMap.get(color);
  if (!sessionId) return true;
  if (sessionId === keepSessionId) return false;

  const sess = sessions.get(sessionId);
  if (!sess) {
    colorMap.delete(color);
    return true;
  }
  if (sess.ws) return false;

  if (sess.disconnectedAt == null) {
    sess.disconnectedAt = now;
    return false;
  }
  if (now - sess.disconnectedAt < graceMs) return false;

  sessions.delete(sessionId);
  if (colorMap.get(color) === sessionId) {
    colorMap.delete(color);
  }
  return true;
}

export type AttachResult =
  | {
      /**
       * Reattached to an existing session.
       */
      status: 'restored';
      /**
       * Session id.
       */
      sessionId: string;
      /**
       * Colour held by the session.
       */
      color: Color;
    }
  | {
      /**
       * Created a new session.
       */
      status: 'accepted';
      /**
       * Session id.
       */
      sessionId: string;
      /**
       * Assigned colour.
       */
      color: Color;
    }
  | {
      /**
       * The requested colour is still held.
       */
      status: 'rejected';
      /**
       * Machine-readable reason.
       */
      reason: string;
    };

/**
 * Attach a socket to a session: reattach a known id, create a new session, or
 * reject if the requested colour is still held by a live or recent session.
 */
export function attachSession(
  sessionId: string | null,
  requestedColor: Color,
  ws: Socket,
  options: { now?: number; graceMs?: number } = {},
): AttachResult {
  const now = options.now ?? Date.now();
  const graceMs = options.graceMs ?? DEFAULT_RECONNECT_GRACE_MS;

  if (requestedColor) {
    releaseStaleColor(requestedColor, now, graceMs, sessionId);
  }

  if (sessionId && sessions.has(sessionId)) {
    const sess = sessions.get(sessionId)!;
    const desired = chooseColorForReattach(sessionId, requestedColor || undefined);
    if (desired === null && requestedColor) {
      return { status: 'rejected', reason: 'color-taken' };
    }

    replaceSocket(sess, ws);
    return { status: 'restored', sessionId, color: sess.color };
  }

  if (requestedColor && colorMap.has(requestedColor)) {
    return { status: 'rejected', reason: 'color-taken' };
  }

  const created = createSession(requestedColor, ws);
  return { status: 'accepted', sessionId: created.sessionId, color: created.color };
}

/**
 * Mark a session's socket as gone. Ignores close events from a socket that has
 * already been replaced, so a reconnect cannot detach the new connection.
 * Spectator sessions are dropped immediately; coloured sessions wait for the
 * reconnect grace.
 */
export function detachSession(sessionId: string, ws?: Socket, now = Date.now()): boolean {
  const sess = sessions.get(sessionId);
  if (!sess) return false;
  if (ws && sess.ws && sess.ws !== ws) return false;
  sess.ws = undefined;
  sess.disconnectedAt = now;
  if (!sess.color) {
    sessions.delete(sessionId);
  }
  return true;
}

/**
 * Evict the session holding a colour (used by the CLI/admin endpoints).
 * Returns true if a session was removed.
 */
export function clearColor(color: NonNullable<Color>): boolean {
  const sid = colorMap.get(color);
  if (!sid) return false;
  const sess = sessions.get(sid);
  try {
    sess?.ws?.close(4003, 'color-cleared');
  } catch {
    // ignore
  }
  colorMap.delete(color);
  sessions.delete(sid);
  console.log(`Cleared color ${color} (session ${sid})`);
  return true;
}
