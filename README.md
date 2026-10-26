# Free Chess

Bitboard chess with a Preact/Fastify front end and a Bun matchmaking service.

## Run

```bash
bun install
bun run dev          # web app on :5179
bun run dev:server   # matchmaking on :4001
bun run test
bun run lint
bun run build
```

Preview services are `sun-app@free-chess` (`:5179`) and
`sun-worker@free-chess-matchmaking` (`:4001`). Browsers use
`wss://chess-server.int.scarlettparker.co.uk`; development uses `/ws`.

## Sessions

The browser stores a `sessionId` and reattaches with it. A colour stays
reserved for five seconds after a disconnect, then another connection may take
it.

The matchmaking service listens on `127.0.0.1:4002` for admin commands
(`list`, `cw`, `cb`, `clear`, `reset`). It is not reverse-proxied and requires
`ADMIN_TOKEN`.

WebSocket connections are origin-checked, rate-limited and pruned after their
reconnect grace expires.

## Auth

Auth uses existing accounts; public sign-up is disabled. Magic-link and Google
sign-in are optional.

## Environment

Required in production:

- `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`
- `CSRF_SECRET`
- `ADMIN_TOKEN`
- `ALLOWED_WS_ORIGINS` or `ALLOWED_ORIGINS`

Optional:

- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `MAIL_FROM`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `AUTH_DB_PATH`

## Deploy

- Set the production environment and keep `.env*` at mode `600`.
- Run `bun run deploy`.
- Check both units: `sun-app@free-chess` and
  `sun-worker@free-chess-matchmaking`.
