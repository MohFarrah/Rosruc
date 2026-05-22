# Architecture

The starter project uses one backend folder so the hackathon team can work in a single server boundary while keeping runtime responsibilities clear.

```text
frontend -> backend/api -> backend/ai
                 |
                 -> backend/db starter files
```

## Frontend

`frontend/` is a Vite React app. It submits support tickets to the API and renders ticket status, placeholder agent logs, and the draft report.

## Backend API

`backend/api/` is the Express adapter for browsers and later external clients. It owns routing, request validation, response shapes, CORS, and in-memory ticket state in the first version.

## Backend AI

`backend/ai/` is the Python workflow area for ticket parsing, reproduction planning, sandbox commands, fix attempts, tests, and reports. The JavaScript API service mirrors its intended result shape until process or queue wiring is added.

## Persistence

SQLite starter SQL lives in `backend/db/`. The in-memory service keeps the first demo simple, while the shared schemas make it clear which fields should persist later.
