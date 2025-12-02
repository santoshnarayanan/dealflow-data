// backend/routes/health.js
import express from "express";
import driver from "../config/neo4j.js";
import { weaviateClient } from "../config/weaviate.js";
import { logger } from "../logger.js";
import { runMultiAgentQuery } from "../ai/services/multiAgentService.js";
import { initLangChain } from "../ai/services/langchainService.js";

const router = express.Router();

// ---------------------
// Simple Health Check
// ---------------------
router.get("/", (req, res) => {
  logger.info("💚 Basic health check");
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ---------------------
// Neo4j Health Check
// ---------------------
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

// ---------------------
// Weaviate Health Check
// ---------------------
router.get("/weaviate", async (req, res) => {
  try {
    logger.info("🩺 Checking Weaviate readiness...");
    const ready = await fetch(
      `http://${process.env.WEAVIATE_HOST || "localhost:8080"}/v1/.well-known/ready`
    ).then((r) => r.json());

    res.json({ status: "ok", weaviate: ready });
  } catch (err) {
    logger.error({ err }, "❌ Weaviate health check failed");
    res.status(500).json({ status: "error", error: err.message });
  }
});

// ---------------------
// Agent System Health
// ---------------------
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

// ---------------------
// Full Summary
// ---------------------
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
    summary.neo4j = "ok";
    await session.close();
  } catch (err) {
    summary.neo4j = err.message;
  }

  // Weaviate
  // try {
  //   const ready = await fetch(
  //     `http://${process.env.WEAVIATE_HOST || "localhost:8080"}/v1/.well-known/ready`
  //   ).then((r) => r.json());
  //   summary.weaviate = ready.status || "unknown";
  // } catch (err) {
  //   summary.weaviate = err.message;
  // }

  let ready;

  try {
    ready = await fetch(`http://${host}/v1/.well-known/ready`).then(r => r.text());
    if (!ready || ready.trim() === "") {
      // fallback to schema query
      const schema = await fetch(`http://${host}/v1/schema`).then(r => r.json());
      ready = schema ? { status: "READY" } : null;
    } else {
      ready = JSON.parse(ready);
    }
  } catch (err) {
    logger.warn("Primary /ready endpoint failed, trying fallback...");

    try {
      const schema = await fetch(`http://${host}/v1/schema`).then(r => r.json());
      ready = schema ? { status: "READY" } : null;
    } catch {
      throw new Error("Weaviate not reachable");
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
