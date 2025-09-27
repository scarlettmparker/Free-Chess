/**
 * Lightweight in-memory session store and helpers.
 */

export type Color = 'white' | 'black' | null;

export type Session = {
  color: Color;
  ws?: unknown;
};

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
  ws?: unknown,
): { sessionId: string; color: Color } {
  let chosenColor: Color = null;
  if (requestedColor && !colorMap.has(requestedColor as NonNullable<Color>)) {
    chosenColor = requestedColor as Color;
  } else if (!colorMap.has('white')) chosenColor = 'white';
  else if (!colorMap.has('black')) chosenColor = 'black';
  else chosenColor = null;

  const newSessionId = makeId();
  sessions.set(newSessionId, { color: chosenColor, ws });
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
 * Clear a color mapping (used by CLI). Returns true if cleared.
 */
export function clearColor(color: NonNullable<Color>): boolean {
  const sid = colorMap.get(color);
  if (!sid) return false;
  const sess = sessions.get(sid);
  try {
    // if ws present and has close method, try to close it
    // @ts-ignore
    sess?.ws?.close?.(1000, 'cleared-by-cli');
  } catch (e) {
    // ignore
  }
  colorMap.delete(color);
  if (sess) sess.color = null;
  console.log(`Cleared color ${color} (session ${sid})`);
  return true;
}
