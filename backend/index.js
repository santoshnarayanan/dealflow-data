// backend/index.js
import express from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { logger } from "./logger.js";

import startupRoutes from "./routes/startups.js";
import investorRoutes from "./routes/investors.js";
import searchRoutes from "./routes/search.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import driver from "./config/neo4j.js";

import aiRoutes from "./ai/routes/aiRoutes.js";
import vectorRoutes from "./routes/vector.js";
import healthRoutes from "./routes/health.js";
import metricRoutes from "./routes/metrics.js";

const app = express();

// Logging middleware
app.use(
  pinoHttp({
    logger,
    customSuccessMessage: function () {
      return "request completed";
    },
    customErrorMessage: function () {
      return "request errored";
    },
  })
);

app.use(cors());
app.use(express.json());

// Routes
app.use("/startups", startupRoutes);
app.use("/investors", investorRoutes);
app.use("/search", searchRoutes);
app.use("/ai", aiRoutes); // ✅ AI routes (e.g. POST /ai/ai-query)
app.use("/vector", vectorRoutes);
app.use("/health", healthRoutes);
app.use("/metrics", metricRoutes);

// Health check
// app.get("/health", (req, res) => res.json({ status: "ok" }));

// Error handling
app.use(errorHandler);

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down gracefully...");
  await driver.close();
  process.exit(0);
});

const PORT = process.env.PORT || 8080;

// ✅ Init LangChain before starting server
async function startServer() {
  try {
    // await initLangChain();
    app.listen(PORT, () => console.log(`🚀 API running on port ${PORT}`));
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
}

startServer();
