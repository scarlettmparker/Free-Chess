# Free Chess VPS deploy

```sh
./vm/vps/deploy-free-chess.sh
./vm/vps/deploy-free-chess.sh --skip-build
```

Deploys the web app and matchmaking worker to the `medusa` container, seeds the
SQLite game database, and restarts both services. Woodpecker runs this with
`--skip-build` after its build step.
