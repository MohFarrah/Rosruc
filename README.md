# Docker Dev Optimizer

VS Code extension UI for the Docker Optimizer 3-act suite: **Dockalyzer** (diagnose) → **AutoStage** (optimize) → **HotDock** (live sync).

## Run locally

### Backend (docker-optimizer API)

```powershell
cd docker-optimizer
pip install fastapi uvicorn
python api.py
```

API runs at `http://localhost:8000`. See `docker-optimizer/BACKEND_INTEGRATION.md` for endpoint details.

### Frontend (Vite + React)

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. API calls proxy to `http://localhost:8000` via `/api/*`.

By default, `.env.development` uses demo data so the UI works without the backend. Set `VITE_USE_DEMO_DATA=false` and restart the dev server to hit the real API.

### VS Code extension

```powershell
npm run compile
```

Press F5 in VS Code to launch the Extension Development Host. The sidebar webview loads `frontend/dist/` after `npm run build` in `frontend/`.

## Project layout

- `frontend/` — React webview panel (optimizer UI)
- `docker-optimizer/` — Python 3-act suite + FastAPI (`/analyze`, `/optimize`, `/watch`)
- `backend/` — Extension CLI backend (Python)
- `src/` — VS Code extension host (TypeScript)
