from pathlib import Path

OPTIMIZER_ROOT = Path(__file__).resolve().parents[2]
DEMO_ROOT = OPTIMIZER_ROOT / "demo"
MONOREPO_ROOT = DEMO_ROOT / "monorepo"
SERVICE_GRAPH_PATH = MONOREPO_ROOT / "service_graph.json"
INTENTS_DIR = DEMO_ROOT / "intents"
PRS_DIR = DEMO_ROOT / "prs"

DATABASE_URL = f"sqlite:///{OPTIMIZER_ROOT / 'optimizer.db'}"
COMPUTE_COST_PER_MINUTE = 0.12

CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
