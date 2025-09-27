import { clearColor, sessions } from './sessions.js';

/** Clear the stored color mapping for CLI use. Returns true if cleared. */
export function cliClearColor(color: 'white' | 'black') {
  const ok = clearColor(color);
  if (!ok) console.log(`No session for color ${color}`);
  return ok;
}

/** List sessions for CLI or debugging. */
export function cliListSessions() {
  const out: Array<{ sid: string; color: string | null; connected: boolean }> = [];
  for (const [sid, s] of sessions.entries()) {
    out.push({ sid, color: s.color ?? null, connected: !!s.ws });
  }
  return out;
}
