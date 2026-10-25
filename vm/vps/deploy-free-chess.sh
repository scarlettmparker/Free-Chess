#!/usr/bin/env bash
set -euo pipefail

SELF="$(readlink -f "${BASH_SOURCE[0]}")"
HERE="$(dirname "$SELF")"
REPO="$(cd "$HERE/../.." && pwd)"
VPS="${VPS:-ubuntu@vps.scarlettparker.co.uk}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/ubuntu.key}"
CONTAINER=medusa
REMOTE_TMP=/tmp/sun-vps
ENV_FILE="$REPO/.env"
BUN="${BUN:-$HOME/.bun/bin/bun}"
SKIP_BUILD=0
[ "${1:-}" = "--skip-build" ] && SKIP_BUILD=1

# Prints a status line.
#
# @param $@ Message parts.
log() { printf '\033[1;36m==>\033[0m %s\n' "$*"; }

# Runs a command on the VPS.
#
# @param $@ Command and arguments.
remote() { ssh -i "$SSH_KEY" -o BatchMode=yes "$VPS" "$@"; }

# Builds Free Chess and the ARM64 dependency tree.
build() {
  local log
  if [ "$SKIP_BUILD" = "0" ]; then
    log "build: Free Chess"
    log="$(mktemp "${TMPDIR:-/tmp}/free-chess-build.XXXXXX.log")"
    if ! (cd "$REPO" && VITE_SERVER_BASE=https://chess.scarlettparker.co.uk \
      VITE_WS_URL=wss://chess-server.scarlettparker.co.uk \
      ALLOWED_HOSTS=chess.scarlettparker.co.uk,localhost \
      "$BUN" run build >"$log" 2>&1); then
      cat "$log" >&2
      rm -f "$log"
      return 1
    fi
    rm -f "$log"
  fi

  log "deps: ARM64 node_modules"
  remote "rm -rf /tmp/free-chess-deps && mkdir -p /tmp/free-chess-deps"
  rsync -az -e "ssh -i $SSH_KEY" \
    "$REPO/package.json" "$REPO/bun.lock" "$REPO/bunfig.toml" \
    "$VPS:/tmp/free-chess-deps/"
  remote "cd /tmp/free-chess-deps && /home/ubuntu/.bun/bin/bun install --production --frozen-lockfile --no-progress"
  remote "cd /tmp/free-chess-deps && tar -czf /tmp/free-chess-deps.tgz node_modules"
}

# Renders the container env.
#
# @param $1 Output path.
render_env() {
  local out="$1"
  umask 077
  cp "$ENV_FILE" "$out"
  sed -i \
    -e 's|^GRAPHQL_ENDPOINT=.*|GRAPHQL_ENDPOINT=http://10.89.20.202:8083/graphql|' \
    -e 's|^SERVER_HOST=.*|SERVER_HOST=0.0.0.0|' \
    -e 's|^SERVER_PORT=.*|SERVER_PORT=5179|' \
    -e 's|^VITE_SERVER_BASE=.*|VITE_SERVER_BASE=https://chess.scarlettparker.co.uk|' \
    -e 's|^VITE_WS_URL=.*|VITE_WS_URL=wss://chess-server.scarlettparker.co.uk|' \
    -e 's|^ALLOWED_HOSTS=.*|ALLOWED_HOSTS=chess.scarlettparker.co.uk,localhost|' \
    -e 's|^ALLOWED_ORIGINS=.*|ALLOWED_ORIGINS=chess.scarlettparker.co.uk|' \
    -e 's|^BETTER_AUTH_URL=.*|BETTER_AUTH_URL=https://chess.scarlettparker.co.uk|' \
    "$out"
  cat >>"$out" <<ENV
MATCHMAKING_URL=http://127.0.0.1:4001
ALLOWED_WS_ORIGINS=chess.scarlettparker.co.uk
GAME_DB_PATH=/var/lib/free-chess/game.db
HOST=0.0.0.0
PORT=4001
ADMIN_PORT=4002
ENV
}

# Copies a file into the container.
#
# @param $1 Local path.
# @param $2 Container path.
push_file() {
  local local_path="$1" remote_path="$2"
  remote "sudo lxc exec '$CONTAINER' -- rm -f '$remote_path'"
  remote "sudo lxc file push -q -p --mode 0644 '$REMOTE_TMP/$(basename "$local_path")' '$CONTAINER$remote_path'"
}

deploy() {
  local app_tar tmp
  build
  app_tar="$(mktemp -d)/free-chess.tgz"
  tar -czf "$app_tar" -C "$REPO" \
    dist/client dist/server server.js config.js config.d.ts css-plugin.ts \
    package.json tsconfig.json bunfig.toml bun.lock .bun-version \
    routes messages src server public

  remote "sudo lxc exec '$CONTAINER' -- mkdir -p /opt/free-chess /var/lib/free-chess"
  remote "sudo lxc exec '$CONTAINER' -- bash -c 'find /opt/free-chess -mindepth 1 -maxdepth 1 ! -name node_modules -exec rm -rf {} +'"
  rsync -az -e "ssh -i $SSH_KEY" "$app_tar" "$VPS:$REMOTE_TMP/free-chess.tgz"
  remote "sudo lxc exec '$CONTAINER' -- rm -f /tmp/free-chess.tgz /tmp/free-chess-deps.tgz"
  remote "sudo lxc file push -q -p --mode 0644 '$REMOTE_TMP/free-chess.tgz' '$CONTAINER/tmp/free-chess.tgz'"
  remote "sudo lxc exec '$CONTAINER' -- tar -xzf /tmp/free-chess.tgz -C /opt/free-chess"
  remote "sudo lxc exec '$CONTAINER' -- bash -c 'rm -rf /opt/free-chess/node_modules'"
  remote "sudo lxc file push -q -p --mode 0644 /tmp/free-chess-deps.tgz '$CONTAINER/tmp/free-chess-deps.tgz'"
  remote "sudo lxc exec '$CONTAINER' -- tar -xzf /tmp/free-chess-deps.tgz -C /opt/free-chess"

  if [ -f "$ENV_FILE" ]; then
    tmp="$(mktemp)"
    render_env "$tmp"
    rsync -az -e "ssh -i $SSH_KEY" "$tmp" "$VPS:$REMOTE_TMP/free-chess.env"
    remote "sudo lxc exec '$CONTAINER' -- rm -f /tmp/free-chess.env.tmp"
    remote "sudo lxc file push -q -p --mode 0600 '$REMOTE_TMP/free-chess.env' '$CONTAINER/tmp/free-chess.env.tmp'"
    remote "sudo lxc exec '$CONTAINER' -- mv /tmp/free-chess.env.tmp /opt/free-chess/.env.production"
    rm -f "$tmp"
  fi

  rsync -az -e "ssh -i $SSH_KEY" "$HERE/files/" "$VPS:$REMOTE_TMP/files/"
  remote "sudo lxc file push -q -p --mode 0644 '$REMOTE_TMP/files/free-chess.service' '$CONTAINER/etc/systemd/system/free-chess.service'"
  remote "sudo lxc file push -q -p --mode 0644 '$REMOTE_TMP/files/free-chess-matchmaking.service' '$CONTAINER/etc/systemd/system/free-chess-matchmaking.service'"

  remote "sudo lxc exec '$CONTAINER' -- bash -c 'cd /opt/free-chess && GAME_DB_PATH=/var/lib/free-chess/game.db /usr/local/bin/bun server/scripts/migrate-game.ts'"
  remote "sudo lxc exec '$CONTAINER' -- chown -R root:root /opt/free-chess /var/lib/free-chess"

  remote "sudo lxc exec '$CONTAINER' -- systemctl daemon-reload"
  remote "sudo lxc exec '$CONTAINER' -- systemctl enable free-chess free-chess-matchmaking"
  remote "sudo lxc exec '$CONTAINER' -- systemctl restart free-chess-matchmaking"
  remote "sudo lxc exec '$CONTAINER' -- systemctl restart free-chess"
  for _ in $(seq 1 60); do
    if remote "sudo lxc exec '$CONTAINER' -- curl -sf http://127.0.0.1:5179/login >/dev/null"; then
      log "free-chess: healthy"
      return 0
    fi
    sleep 1
  done
  remote "sudo lxc exec '$CONTAINER' -- journalctl -u free-chess -u free-chess-matchmaking -n 80 --no-pager" || true
  return 1
}

deploy
