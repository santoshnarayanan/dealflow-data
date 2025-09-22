// backend/index.js
import express from "express";
import cors from "cors";
import morgan from "morgan";

import startupRoutes from "./routes/startups.js";
import investorRoutes from "./routes/investors.js";
import searchRoutes from "./routes/search.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import driver from "./config/neo4j.js";

// ✅ AI imports
import aiRoutes from "./ai/routes/aiRoutes.js";
import { initLangChain } from "./ai/services/langchainService.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Routes
app.use("/startups", startupRoutes);
app.use("/investors", investorRoutes);
app.use("/search", searchRoutes);
app.use("/ai", aiRoutes); // ✅ AI routes (e.g. POST /ai/ai-query)

// Health check
app.get("/health", (req, res) => res.json({ status: "ok" }));

// Error handling
app.use(errorHandler);

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down gracefully...");
  await driver.close();
  process.exit(0);
});

const PORT = process.env.PORT || 3000;

// ✅ Init LangChain before starting server
async function startServer() {
  try {
    await initLangChain();
    app.listen(PORT, () => console.log(`🚀 API running on port ${PORT}`));
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
}

startServer();
