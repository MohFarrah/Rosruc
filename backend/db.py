import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional


BACKEND_DIR = Path(__file__).resolve().parent
DATA_DIR = BACKEND_DIR / "data"
DB_PATH = DATA_DIR / "optimizer.db"


SCHEMA = """
CREATE TABLE IF NOT EXISTS optimizer_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mode TEXT,
  interval TEXT,
  auto INTEGER,
  status TEXT,
  before_time TEXT,
  after_time TEXT,
  summary TEXT,
  recommendation TEXT,
  created_at TEXT
);
"""


def save_successful_run(result: dict) -> Optional[str]:
    """Persist successful optimizer runs. Return a warning instead of raising."""
    try:
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        with sqlite3.connect(DB_PATH) as connection:
            connection.execute(SCHEMA)
            connection.execute(
                """
                INSERT INTO optimizer_runs (
                  mode,
                  interval,
                  auto,
                  status,
                  before_time,
                  after_time,
                  summary,
                  recommendation,
                  created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    result.get("mode"),
                    result.get("interval"),
                    1 if result.get("auto") else 0,
                    result.get("status"),
                    result.get("beforeTime"),
                    result.get("afterTime"),
                    result.get("summary"),
                    result.get("recommendation"),
                    datetime.now(timezone.utc).isoformat(),
                ),
            )
            connection.commit()
    except Exception as error:
        return f"Database save failed: {error}"

    return None
