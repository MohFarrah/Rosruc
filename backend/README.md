# Docker Dev Optimizer Backend

This backend is a Python CLI for the Docker Dev Optimizer VS Code extension.
It is not a web server, does not use FastAPI or Express, and does not run real
Docker or AI calls yet.

The VS Code extension can call this CLI and read one JSON object from stdout.

## Modes

- `dockalyzer` explains likely Docker cache busts.
- `autostage` suggests an optimized Dockerfile structure.
- `hotdock` generates a no-build `docker cp` sync plan for local development.

## Commands

```sh
python backend/cli.py --mode dockalyzer --interval 30s
python backend/cli.py --mode autostage --interval none
python backend/cli.py --mode hotdock --interval 1m --auto true
```

Each successful run is saved to `backend/data/optimizer.db` with a compact
history record for future extension panels.
