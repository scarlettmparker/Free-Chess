# Free Chess

A bitboard chess engine with a Sun-stack front-end and a Bun matchmaking
service.

## Stack

- Front-end: Preact via `@sun/*`, Fastify SSR, CSS modules, Vite.
- Engine: TypeScript, shared by the front-end and the matchmaking server.
- Matchmaking: Bun websockets, in-memory sessions.

## Scripts

```bash
bun install
bun run dev          # dev server on :5179 (stops the preview unit)
bun run dev:server   # matchmaking on :4001 (stops the worker unit)
bun run test
bun run lint
bun run fmt
bun run build        # build, then restart the preview unit
bun run preview
bun run restart:server
```

Preview services:

- `sun-app@free-chess.service` on `:5179`, proxied as `chess.int.scarlettparker.co.uk`.
- `sun-worker@free-chess-matchmaking.service` on `:4001`, proxied as `chess-server.int.scarlettparker.co.uk`.

The browser connects to `wss://chess-server.int.scarlettparker.co.uk`. In dev it
uses the same-origin `/ws` proxy on the Fastify server.

## Layout

- `src/game/**` - engine, FEN, move generation, perft.
- `src/components/chess/**` - board, squares, pieces, status.
- `src/hooks/**` - engine view model and matchmaking socket.
- `src/entry-client.tsx`, `src/entry-server.tsx` - hydration and SSR entry.
- `routes/index.js` - Fastify catch-all render route.
- `server/src/**` - matchmaking service.
- `public/piece/**` - sprites and move sounds.
