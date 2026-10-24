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
bun run db:migrate
bun run auth:create-admin --email you@example.com --name "Your Name"
bun run db:backup    # optional output path as the first argument
```

Preview services:

- `sun-app@free-chess.service` on `:5179`, proxied as `chess.int.scarlettparker.co.uk`.
- `sun-worker@free-chess-matchmaking.service` on `:4001`, proxied as `chess-server.int.scarlettparker.co.uk`.

The browser connects to `wss://chess-server.int.scarlettparker.co.uk`. In dev it
uses the same-origin `/ws` proxy on the Fastify server.

## Sessions

The browser keeps a `sessionId` in `localStorage` and reattaches with it. A
colour stays reserved for its session for five seconds after a disconnect
(`DEFAULT_RECONNECT_GRACE_MS`). After that, a new connection asking for the
colour takes it over.

The matchmaking service also listens on `127.0.0.1:4002` (`ADMIN_PORT`) for
local admin commands. That port is not reverse-proxied and requires
`ADMIN_TOKEN`.

```bash
curl -H "Authorization: Bearer $ADMIN_TOKEN" -X POST http://127.0.0.1:4002/list
curl -H "Authorization: Bearer $ADMIN_TOKEN" -X POST http://127.0.0.1:4002/cw      # clear white
curl -H "Authorization: Bearer $ADMIN_TOKEN" -X POST http://127.0.0.1:4002/cb      # clear black
curl -H "Authorization: Bearer $ADMIN_TOKEN" -X POST http://127.0.0.1:4002/clear   # clear both
curl -H "Authorization: Bearer $ADMIN_TOKEN" -X POST http://127.0.0.1:4002/reset   # reset the game
```

## Auth

Admins live in a SQLite database managed by better-auth. Email and password
sign-in is enabled, public sign-up is disabled, and the first admin is created
with `auth:create-admin`. `/login` is public; the chess board stays public for
guests.

Magic-link sign-in is available for existing accounts. Enter an email on
`/login`, and the app sends a single-use link that expires after 15 minutes.
Unknown and banned accounts get the same "check your inbox" page and no email.
Links go out through Gmail SMTP. Set `SMTP_USER` to the Gmail address and
`SMTP_PASSWORD` to an app password (2FA must be on). Without those in
development the link is printed to the server log; in production the request
returns an email-unavailable error and password login keeps working.

The database defaults to `$XDG_DATA_HOME/free-chess/auth.db`, then
`~/.local/share/free-chess/auth.db`. Set `AUTH_DB_PATH` to override it.

Environment:

- `BETTER_AUTH_SECRET` - required in production.
- `BETTER_AUTH_URL` - public origin, for example `https://chess.int.scarlettparker.co.uk`.
- `BETTER_AUTH_TRUSTED_ORIGINS` - extra comma-separated origins.
- `CSRF_SECRET` - HMAC key for native form CSRF tokens. Falls back to `BETTER_AUTH_SECRET`.
- `ADMIN_TOKEN` - bearer token shared by the web app and the matchmaking admin API. Required in production.
- `MATCHMAKING_ADMIN_URL` - loopback admin API URL, default `http://127.0.0.1:4002`.
- `SMTP_HOST` - SMTP host, default `smtp.gmail.com`.
- `SMTP_PORT` - SMTP port, default `587`.
- `SMTP_USER` - Gmail address used to send magic links.
- `SMTP_PASSWORD` - Gmail app password for `SMTP_USER`.
- `MAIL_FROM` - From header, default `SMTP_USER`.

Roles are defined in `src/server/permissions.ts`:

- `admin` - everything.
- `game-admin` - reset, clear, list sessions.
- `user-admin` - create, list, manage, and revoke users.
- `user` - no admin permissions.

## Layout

- `src/game/**` - engine, FEN, move generation, perft.
- `src/components/chess/**` - board, squares, pieces, status.
- `src/hooks/**` - engine view model and matchmaking socket.
- `src/entry-client.tsx`, `src/entry-server.tsx` - hydration and SSR entry.
- `routes/index.js` - Fastify catch-all render route.
- `server/src/**` - matchmaking service.
- `public/piece/**` - sprites and move sounds.
