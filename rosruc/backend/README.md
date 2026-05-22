# Backend

The backend folder keeps two implementation tracks together for the hackathon:

- `api/` is the Express server that answers frontend requests.
- `ai/` is the Python placeholder for future agent workflow code.

Tickets are stored in memory by the Express API for now. SQLite starter files live in `db/` so persistence can be added later without changing the project layout.

## Node API

```sh
npm install
npm run dev
```

The API listens on `BACKEND_PORT` or `4000`.

## Python Placeholder

```sh
python3 ai/main.py
```

This prints a sample JSON result and does not call a model or Docker yet.
