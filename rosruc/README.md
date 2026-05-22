# UWT DevTools Hackathon

UWT DevTools Hackathon is a starter project for an AI-powered developer tool. A support ticket enters a small React app, moves through an Express API, and currently receives a placeholder agent result that looks like a future bug reproduction and report run.

## Architecture

The first version keeps the system intentionally small:

- `frontend/` is a Vite React app for ticket entry and result display.
- `backend/api/` is the Node.js and Express API used by the frontend.
- `backend/ai/` is the Python home for future agent and sandbox workflow logic.
- `backend/db/` contains SQLite starter files, but the API uses in-memory storage today.
- `shared/` documents the ticket shape, report shape, and API contract.

The intended request path is `frontend -> backend/api -> backend/ai`. The Node API uses a JavaScript AI placeholder now so the demo can run without Python process wiring or model credentials.

## Local Setup

Create local environment values from the example if needed:

```sh
cp .env.example .env
```

Install frontend dependencies:

```sh
cd frontend
npm install
```

Install backend Node dependencies:

```sh
cd backend
npm install
```

The Python AI placeholder has no third-party packages yet. A future Python environment can install from `backend/requirements.txt` when requirements are added.

## Run

Start the backend from `backend/`:

```sh
npm run dev
```

Start the frontend from `frontend/` in a second terminal:

```sh
npm run dev
```

Open the Vite URL, create a ticket, and press `Run AI Agent`. The UI will show the placeholder ticket status, logs, and report returned by the API.

The Python placeholder can also be run directly:

```sh
python3 backend/ai/main.py
```

## Current Limitations

- Tickets live in memory and disappear when the backend restarts.
- The Node API does not call the Python AI code yet.
- Docker sandboxing, model calls, patch generation, test execution, and PR creation are represented only by placeholders.
- SQLite schema files exist as a next step and are not wired into the API yet.
