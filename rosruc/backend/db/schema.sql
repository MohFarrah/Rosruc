CREATE TABLE IF NOT EXISTS tickets (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'created',
  logs_json TEXT NOT NULL DEFAULT '[]',
  report_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
