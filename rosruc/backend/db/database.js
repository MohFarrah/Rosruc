const path = require("node:path");

// The API uses memory storage today. This path keeps SQLite wiring easy later.
const defaultDatabasePath = path.resolve(__dirname, "../data/app.db");

module.exports = {
  defaultDatabasePath,
  databaseUrl: process.env.DATABASE_URL || `sqlite://${defaultDatabasePath}`,
};
