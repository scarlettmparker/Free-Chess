/**
 * Resolves the matchmaking WebSocket URL. Relative paths are resolved against
 * the page origin so dev and preview both work without a hard-coded host.
 */
export function resolveWebSocketUrl(): string {
  const configured = import.meta.env.VITE_WS_URL;
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

  if (!configured) {
    if (import.meta.env.DEV) {
      return `${protocol}//${window.location.host}/ws`;
    }
    return 'wss://chess-server.int.scarlettparker.co.uk';
  }

  if (/^wss?:\/\//.test(configured)) {
    return configured;
  }

  const path = configured.startsWith('/') ? configured : `/${configured}`;
  return `${protocol}//${window.location.host}${path}`;
}
