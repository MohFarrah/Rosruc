import json
from pathlib import Path

from ai.config import CACHE_DIR


def get(intent_hash: str) -> dict | None:
    path = CACHE_DIR / f"{intent_hash}.json"
    if not path.exists():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


def put(intent_hash: str, payload: dict) -> None:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    path = CACHE_DIR / f"{intent_hash}.json"
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
