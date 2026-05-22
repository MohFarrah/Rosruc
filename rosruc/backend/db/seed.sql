INSERT INTO tickets (
  id,
  title,
  description,
  status,
  logs_json,
  report_json,
  created_at,
  updated_at
) VALUES (
  'ticket-seed-demo',
  'Seed ticket for future SQLite wiring',
  'This row is a starter example and is not loaded by the in-memory API.',
  'created',
  '["Seeded ticket is ready for future persistence demos."]',
  NULL,
  '2026-05-22T00:00:00.000Z',
  '2026-05-22T00:00:00.000Z'
);
