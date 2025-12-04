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
  const traceId = createTraceId();

  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ error: "Question is required", traceId });
    }

    logger.info({ traceId, question }, "🧠 [/ai/ai-query] request");

    const { cypher, result, rawOutput } = await askGraph(question, traceId);

    logger.info({ traceId, cypher }, "🧠 [/ai/ai-query] completed");

    res.json({
      question,
      cypher,
      rawModelOutput: rawOutput,
      graphResult: result,
      traceId,
    });
  } catch (error) {
    logger.error({ traceId, err: error }, "❌ [/ai/ai-query] failed");
    res.status(500).json({ error: "Internal Server Error", traceId });
  }
});

/**
 * RAG over Weaviate (Startups + Investors).
 */
router.post("/ai-rag", async (req, res) => {
  const traceId = createTraceId();

  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ error: "Question is required", traceId });
    }

    logger.info({ traceId, question }, "📚 [/ai/ai-rag] request");

    const ragResult = await askRag(question);

    res.json({ ...ragResult, traceId });
  } catch (error) {
    logger.error({ traceId, err: error }, "❌ [/ai/ai-rag] failed");
    res.status(500).json({ error: "Internal Server Error", traceId });
  }
});

/**
 * Hybrid: Graph + Vector + LLM synthesis.
 */
router.post("/ai-hybrid", async (req, res) => {
  const traceId = createTraceId();

  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ error: "Question is required", traceId });
    }

    logger.info({ traceId, question }, "🧬 [/ai/ai-hybrid] request");

    const hybridResult = await askHybrid(question, traceId);

    logger.info({ traceId, route: "hybrid" }, "🧬 [/ai/ai-hybrid] completed");

    res.json({ ...hybridResult, traceId });
  } catch (error) {
    logger.error({ traceId, err: error }, "❌ [/ai/ai-hybrid] failed");
    res.status(500).json({ error: "Internal Server Error", traceId });
  }
});

// ---- Multi-agent endpoint ----
router.post("/multi-agent-query", async (req, res) => {
  const traceId = createTraceId();
  const question = req.body.question;

  logger.info({ traceId, question }, "🧵 Multi-agent request started");

  try {
    const result = await runMultiAgentQuery(question, traceId);

    logger.info({ traceId, route: result.route }, "🧵 Multi-agent request completed");

    res.json({ ...result, traceId });
  } catch (err) {
    logger.error({ traceId, err }, "❌ Multi-agent request failed");
    res.status(500).json({ error: err.message, traceId });
  }
});

export default router;
