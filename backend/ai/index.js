// backend/ai/index.js
import express from "express";
import bodyParser from "body-parser";
import aiRoutes from "./routes/aiRoutes.js";
import { initLangChain } from "./services/langchainService.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.AI_PORT;

app.use(bodyParser.json());
app.use("/ai", aiRoutes);

async function startServer() {
  await initLangChain();
  app.listen(PORT, () => {
    console.log(`AI service running at http://localhost:${PORT}`);
  });
}

startServer();
