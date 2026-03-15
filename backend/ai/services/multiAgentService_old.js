// backend/ai/services/multiAgentService.js

import { ChatOpenAI } from "@langchain/openai";
import { weaviateClient } from "../../config/weaviate.js";
import { askGraph } from "./langchainService.js";
import { logger } from "../../logger.js";
import { agentDuration } from "../../metrics/metrics.js";

const llm = new ChatOpenAI({
  modelName: "gpt-4o-mini",
  temperature: 0,
  openAIApiKey: process.env.OPENAI_API_KEY,
});

// ------------------------------
// Agent 1: Routing classifier (v2)
// ------------------------------
async function classifyRoute(question, traceId) {
  logger.info({ traceId, question }, "🧭 [Router] deciding route");

  const systemPrompt = `
You are a routing assistant for a dealflow intelligence platform.

Decide the BEST route to answer the user's question:

- Use "cypher" when the question is about:
  - specific startups / investors
  - relationships (who invested in whom, funding rounds, connections)
  - graph-structured queries (paths, hops, filters)

- Use "vector" when the question:
  - is fuzzy / semantic (e.g. "similar startups", "AI fintech in Europe")
  - asks for recommendations or descriptive matches
  - relies more on text similarity than strict structure

- Use "hybrid" when the question:
  - needs BOTH structured graph data and semantic matches
  - combines filters (location, industry) with fuzzy concepts
  - sounds like: "top", "best", "most active", "combine", "overall picture"

Return strict JSON with ONLY:
{
  "route": "cypher" | "vector" | "hybrid",
  "reason": "very short explanation"
}
`;

  const msg = await llm.invoke([
    { role: "system", content: systemPrompt },
    { role: "user", content: question },
  ]);

  const raw = String(msg.content || "").trim();
  logger.debug({ traceId, raw }, "🧭 [Router] raw LLM output");

  let route = "cypher";
  let reason = "Defaulted to cypher";

  try {
    const parsed = JSON.parse(raw);
    if (parsed.route === "cypher" || parsed.route === "vector" || parsed.route === "hybrid") {
      route = parsed.route;
    }
    if (typeof parsed.reason === "string" && parsed.reason.trim().length > 0) {
      reason = parsed.reason.trim();
    }
  } catch (err) {
    // Fallback: simple heuristic if JSON parsing fails
    const lower = raw.toLowerCase();
    if (lower.includes("vector")) route = "vector";
    if (lower.includes("hybrid")) route = "hybrid";
    reason = "Router returned non-JSON; used heuristic fallback.";
  }

  logger.info({ traceId, route, reason }, "🧭 [Router] final decision");

  return { route, reason };
}

// ------------------------------
// Agent 2: Cypher Agent
// ------------------------------
async function runCypherAgent(question, traceId) {
  logger.info({ traceId, question }, "📘 [Cypher] agent started");

  try {
    logger.debug({ traceId, question }, "📘 [Cypher] calling askGraph()");
    const { cypher, result, rawOutput } = await askGraph(question, traceId);

    const recordCount = Array.isArray(result)
      ? result.length
      : result?.records?.length ?? 0;

    logger.debug(
      { traceId, cypher, recordCount },
      "📘 [Cypher] query executed"
    );

    return {
      ok: true,
      cypher,
      result,
      rawOutput,
      recordCount,
    };
  } catch (err) {
    logger.error({ traceId, err }, "❌ [Cypher] agent failed");
    return {
      ok: false,
      error: err.message,
    };
  }
}

// ------------------------------
// Agent 3: Vector Agent
// ------------------------------
async function runVectorAgent(question, traceId) {
  logger.info({ traceId, question }, "🔍 [Vector] agent started");

  try {
    const startupRes = await weaviateClient.graphql
      .get()
      .withClassName("Startup")
      .withFields("name industry description _additional { distance }")
      .withNearText({ concepts: [question] })
      .withLimit(5)
      .do();

    const investorRes = await weaviateClient.graphql
      .get()
      .withClassName("Investor")
      .withFields("name type description _additional { distance }")
      .withNearText({ concepts: [question] })
      .withLimit(5)
      .do();

    const startupsRaw = startupRes.data?.Get?.Startup ?? [];
    const investorsRaw = investorRes.data?.Get?.Investor ?? [];

    const startups = startupsRaw.map((s) => ({
      type: "Startup",
      name: s.name,
      industry: s.industry,
      description: s.description,
      distance: s._additional?.distance ?? null,
    }));

    const investors = investorsRaw.map((i) => ({
      type: "Investor",
      name: i.name,
      investorType: i.type,
      description: i.description,
      distance: i._additional?.distance ?? null,
    }));

    logger.debug(
      {
        traceId,
        startupCount: startups.length,
        investorCount: investors.length,
      },
      "🔍 [Vector] results received"
    );

    return {
      ok: true,
      startups,
      investors,
      totalCount: startups.length + investors.length,
    };
  } catch (err) {
    logger.error({ traceId, err }, "❌ [Vector] agent failed");
    return {
      ok: false,
      error: err.message,
    };
  }
}

// ------------------------------
// Agent 4: Answer Agent (v2)
// ------------------------------
async function runAnswerAgent({ question, route, routerReason, cypherData, vectorData, traceId }) {
  logger.info({ traceId, question, route }, "🧠 [Answer] synthesizing response");

  const systemPrompt = `
You are an AI assistant for a dealflow intelligence platform.

You will receive:
- The user's question
- The route chosen by the router ("cypher", "vector", or "hybrid") and its reason
- Neo4j graph data (if available) from the cypher agent
- Weaviate vector search data (if available) from the vector agent

RULES:
- Use ONLY the provided data (graph + vector). Do NOT invent startups, investors, or funding rounds.
- If there is no relevant data, say you are NOT SURE and explain what is missing.
- If both graph and vector data exist, combine them and mention which source supports which part.
- Keep the answer concise but complete and clearly structured.
- You must return STRICT JSON with keys:
  "answer": string,
  "explanation": string
`;

  const payload = {
    question,
    route,
    routerReason,
    cypherData: cypherData?.ok ? cypherData : null,
    vectorData: vectorData?.ok ? vectorData : null,
  };

  const msg = await llm.invoke([
    { role: "system", content: systemPrompt },
    { role: "user", content: JSON.stringify(payload, null, 2) },
  ]);

  const text = String(msg.content || "").trim();

  try {
    const parsed = JSON.parse(text);
    logger.debug({ traceId }, "🧠 [Answer] JSON parsed successfully");
    return {
      answer: String(parsed.answer ?? "").trim(),
      explanation: String(parsed.explanation ?? "").trim(),
    };
  } catch (err) {
    logger.warn(
      { traceId, text },
      "🧠 [Answer] model returned non-JSON, falling back"
    );
    return {
      answer: text,
      explanation:
        "Model did not return valid JSON; raw text was used as the answer.",
    };
  }
}

// ------------------------------
// Orchestrator (Multi-Agent v2)
// ------------------------------
export async function runMultiAgentQuery(question, traceId = null) {
  logger.info({ traceId, question }, "📌 [Orchestrator] started");

  const decisionTrace = [];

  // 1) Route classification
  const tClassifier = agentDuration.startTimer({ agent: "classifier" });
  const { route, reason: routerReason } = await classifyRoute(question, traceId);
  tClassifier();
  decisionTrace.push({
    step: "router",
    route,
    reason: routerReason,
  });

  let cypherData = null;
  let vectorData = null;

  // 2) Execute agents based on route
  if (route === "cypher") {
    const t = agentDuration.startTimer({ agent: "cypher" });
    cypherData = await runCypherAgent(question, traceId);
    t();
    decisionTrace.push({
      step: "cypher_agent",
      ok: cypherData.ok,
      recordCount: cypherData?.recordCount ?? 0,
      error: cypherData?.error ?? null,
    });

    // Fallback: if cypher failed, try vector
    if (!cypherData.ok) {
      const tFallback = agentDuration.startTimer({ agent: "vector_fallback" });
      vectorData = await runVectorAgent(question, traceId);
      tFallback();
      decisionTrace.push({
        step: "vector_fallback",
        ok: vectorData.ok,
        totalCount: vectorData?.totalCount ?? 0,
        error: vectorData?.error ?? null,
      });
    }
  }

  if (route === "vector") {
    const t = agentDuration.startTimer({ agent: "vector" });
    vectorData = await runVectorAgent(question, traceId);
    t();
    decisionTrace.push({
      step: "vector_agent",
      ok: vectorData.ok,
      totalCount: vectorData?.totalCount ?? 0,
      error: vectorData?.error ?? null,
    });

    // Fallback: if vector failed, try cypher
    if (!vectorData.ok) {
      const tFallback = agentDuration.startTimer({ agent: "cypher_fallback" });
      cypherData = await runCypherAgent(question, traceId);
      tFallback();
      decisionTrace.push({
        step: "cypher_fallback",
        ok: cypherData.ok,
        recordCount: cypherData?.recordCount ?? 0,
        error: cypherData?.error ?? null,
      });
    }
  }

  if (route === "hybrid") {
    const tCypher = agentDuration.startTimer({ agent: "cypher" });
    const tVector = agentDuration.startTimer({ agent: "vector" });

    [cypherData, vectorData] = await Promise.all([
      runCypherAgent(question, traceId),
      runVectorAgent(question, traceId),
    ]);

    tCypher();
    tVector();

    decisionTrace.push(
      {
        step: "cypher_agent",
        ok: cypherData.ok,
        recordCount: cypherData?.recordCount ?? 0,
        error: cypherData?.error ?? null,
      },
      {
        step: "vector_agent",
        ok: vectorData.ok,
        totalCount: vectorData?.totalCount ?? 0,
        error: vectorData?.error ?? null,
      }
    );
  }

  // 3) Answer agent
  const tAnswer = agentDuration.startTimer({ agent: "answer" });
  const { answer, explanation } = await runAnswerAgent({
    question,
    route,
    routerReason,
    cypherData,
    vectorData,
    traceId,
  });
  tAnswer();

  logger.info({ traceId, route }, "📌 [Orchestrator] complete");

  return {
    question,
    route,
    routerReason,
    answer,
    explanation,
    cypher: cypherData?.cypher ?? null,
    cypherResult: cypherData?.result ?? null,
    vectorResult: vectorData ?? null,
    decisionTrace,
  };
}
