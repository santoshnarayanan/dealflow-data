// backend/ai/routes/aiRoutes.js
import express from "express";
import { askGraph, askRag, askHybrid } from "../services/langchainService.js";
import { runMultiAgentQuery } from "../services/multiAgentService.js";
import { createTraceId } from "../../utils/trace.js";
import { logger } from "../../logger.js";

const router = express.Router();

/**
 * Natural language → Cypher → Neo4j.
 */
router.post("/ai-query", async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ error: "Question is required" });
    }

    const { cypher, result, rawOutput } = await askGraph(question,traceId);

    res.json({
      question,
      cypher,
      rawModelOutput: rawOutput,
      graphResult: result,
    });
  } catch (error) {
    console.error("❌ AI /ai-query route error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * RAG over Weaviate (Startups + Investors).
 */
router.post("/ai-rag", async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ error: "Question is required" });
    }

    const ragResult = await askRag(question);
    res.json(ragResult);
  } catch (error) {
    console.error("❌ AI /ai-rag route error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * Hybrid: Graph + Vector + LLM synthesis.
 */
router.post("/ai-hybrid", async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ error: "Question is required" });
    }

    const hybridResult = await askHybrid(question, traceId);
    res.json(hybridResult);
  } catch (error) {
    console.error("❌ AI /ai-hybrid route error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ---- New multi-agent endpoint ----
router.post("/multi-agent-query", async (req, res) => {
  const traceId = createTraceId();
  const question = req.body.question;

  logger.info({ traceId, question }, "🧵 Multi-agent request started");

  try {
    const result = await runMultiAgentQuery(question, traceId);

    logger.info({ traceId, route: result.route }, "🧵 Multi-agent request completed");

    res.json(result);
  } catch (err) {
    logger.error({ traceId, err }, "❌ Multi-agent request failed");
    res.status(500).json({ error: err.message, traceId });
  }
});



export default router;
