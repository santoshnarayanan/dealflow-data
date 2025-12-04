// backend/routes/health.js
import express from "express";
import driver from "../config/neo4j.js";
import { logger } from "../logger.js";
import { runMultiAgentQuery } from "../ai/services/multiAgentService.js";
import { initLangChain } from "../ai/services/langchainService.js";

const router = express.Router();
const WEAVIATE_HOST = process.env.WEAVIATE_HOST || "localhost:8080";

// Simple health
router.get("/", (req, res) => {
  logger.info("💚 Basic health check");
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Neo4j
router.get("/neo4j", async (req, res) => {
  const session = driver.session({ database: process.env.NEO4J_DATABASE });

  try {
    logger.info("🩺 Checking Neo4j connectivity...");
    const result = await session.run("RETURN 1 AS ok");
    res.json({ status: "ok", result: result.records[0].get("ok") });
  } catch (err) {
    logger.error({ err }, "❌ Neo4j health check failed");
    res.status(500).json({ status: "error", error: err.message });
  } finally {
    await session.close();
  }
});

// Weaviate
router.get("/weaviate", async (req, res) => {
  try {
    logger.info("🩺 Checking Weaviate readiness...");
    const text = await fetch(
      `http://${WEAVIATE_HOST}/v1/.well-known/ready`
    ).then((r) => r.text());

    let ready;
    if (!text || text.trim() === "") {
      const schema = await fetch(`http://${WEAVIATE_HOST}/v1/schema`).then((r) =>
        r.json()
      );
      ready = schema ? { status: "READY" } : null;
    } else {
      ready = JSON.parse(text);
    }

    res.json({ status: "ok", weaviate: ready });
  } catch (err) {
    logger.error({ err }, "❌ Weaviate health check failed");
    res.status(500).json({ status: "error", error: err.message });
  }
});

// Agent system
router.get("/agents", async (req, res) => {
  try {
    logger.info("🤖 Checking multi-agent readiness...");
    await initLangChain();
    const test = await runMultiAgentQuery("health check");

    res.json({
      status: "ok",
      route: test.route,
      explanation: test.explanation,
    });
  } catch (err) {
    logger.error({ err }, "❌ Agent system health check failed");
    res.status(500).json({ status: "error", error: err.message });
  }
});

// Full summary
router.get("/summary", async (req, res) => {
  logger.info("📊 Running full system health summary...");

  const summary = {
    timestamp: new Date().toISOString(),
    neo4j: null,
    weaviate: null,
    agents: null,
  };

  // Neo4j
  try {
    const session = driver.session({ database: process.env.NEO4J_DATABASE });
    const result = await session.run("RETURN 1 AS ok");
    summary.neo4j = result.records[0].get("ok") === 1 ? "ok" : "unknown";
    await session.close();
  } catch (err) {
    summary.neo4j = err.message;
  }

  // Weaviate
  try {
    const text = await fetch(
      `http://${WEAVIATE_HOST}/v1/.well-known/ready`
    ).then((r) => r.text());

    let ready;
    if (!text || text.trim() === "") {
      const schema = await fetch(`http://${WEAVIATE_HOST}/v1/schema`).then((r) =>
        r.json()
      );
      ready = schema ? { status: "READY" } : null;
    } else {
      ready = JSON.parse(text);
    }

    summary.weaviate = ready?.status || "unknown";
  } catch (err) {
    logger.warn({ err }, "Weaviate summary check failed; trying fallback");
    try {
      const schema = await fetch(`http://${WEAVIATE_HOST}/v1/schema`).then((r) =>
        r.json()
      );
      summary.weaviate = schema ? "READY" : "unreachable";
    } catch (innerErr) {
      summary.weaviate = innerErr.message;
    }
  }

  // Agents
  try {
    await initLangChain();
    const test = await runMultiAgentQuery("health check");
    summary.agents = test.route || "ok";
  } catch (err) {
    summary.agents = err.message;
  }

  res.json(summary);
});

export default router;
