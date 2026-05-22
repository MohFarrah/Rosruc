const cors = require("cors");
const dotenv = require("dotenv");
const express = require("express");
const path = require("node:path");
const errorHandler = require("./middleware/errorHandler");
const healthRoutes = require("./routes/health.routes");
const ticketsRoutes = require("./routes/tickets.routes");

dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
});

const app = express();
const port = Number(process.env.BACKEND_PORT || 4000);

app.use(cors());
app.use(express.json());

app.use("/health", healthRoutes);
app.use("/tickets", ticketsRoutes);

app.use((request, response) => {
  response.status(404).json({
    error: `Route not found: ${request.method} ${request.originalUrl}`,
  });
});

app.use(errorHandler);

app.listen(port, () => {
  console.log(`UWT DevTools API listening on http://localhost:${port}`);
});
