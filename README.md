# Free Chess

A bitboard chess engine with a Sun-stack front-end and a Bun matchmaking
service. No Spring, no GraphQL.

## Stack

- Front-end: Preact via `@sun/*`, Fastify SSR, CSS modules, Vite.
- Engine: TypeScript, shared by the front-end and the matchmaking server.
- Matchmaking: Bun + websockets, in-memory sessions.

## Scripts

```bash
bun install
bun run dev          # Fastify dev server on :5177
bun run dev:server   # matchmaking service on :4001
bun run test
bun run lint
bun run fmt
bun run build
bun run preview
```

## Layout

- `src/game/**` — engine, FEN, move generation, perft.
- `src/_components/**` — board UI.
- `src/entry-client.tsx`, `src/entry-server.tsx` — hydration and SSR entry.
- `routes/index.js` — Fastify catch-all render route.
- `server/src/**` — matchmaking service.
- `public/piece/**` — sprites and move sounds.

## Migration state

Scaffold and tooling are on the Sun stack. The board still needs porting from
Solid to Preact, and the matchmaking service still needs porting to `Bun.serve`.
