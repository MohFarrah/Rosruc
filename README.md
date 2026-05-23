# Intent-Aware CI/CD Optimizer

An AI-powered CI/CD optimization engine that reads engineering intent from project-management tickets and pull requests, determines what parts of a codebase are actually affected, and selectively executes only the necessary builds, tests, and deployments to reduce compute waste and accelerate engineering velocity.

## Run locally

### Backend (FastAPI)

```sh
cd optimizer
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
cd backend
uvicorn app.main:app --reload --port 8000
```

### Frontend (Vite + React)

```sh
cd optimizer/frontend
npm install
npm run dev
```

Open the Vite dev URL (typically `http://localhost:5173`). The frontend proxies API requests to `http://localhost:8000`.

## Project layout

- `optimizer/backend/` — FastAPI API, SQLite, YAML generation, simulated CI executor
- `optimizer/frontend/` — React dashboard (impact graph, savings, approval workflow)
- `optimizer/ai/` — OpenAI orchestrator (IntentParser, ImpactAnalyzer, PipelineOptimizer)
- `optimizer/demo/` — Fake monorepo, Jira intents, and PR fixtures for the demo
