# Backend

FastAPI service for the Intent-Aware CI/CD Optimizer.

```powershell
cd optimizer
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
cd backend
..\..\.venv\Scripts\uvicorn app.main:app --reload --port 8000
```

Or: `.\run_dev.ps1` from this directory (with venv activated).

Endpoints stubbed except `/health`, `/intents`, `/savings/aggregate`.
