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
// Agent 1: Routing classifier
// ------------------------------
async function classifyRoute(question, traceId) {
  logger.info({ traceId, question }, "🧭 Classifier: routing decision");
  logger.debug({ traceId, question }, "🧭 [Classifier] Deciding route...");

  const systemPrompt = `
You are a routing assistant. Return only:
cypher
vector
hybrid
(no punctuation)
`;

  const msg = await llm.invoke([
    { role: "system", content: systemPrompt },
    { role: "user", content: question },
  ]);

  const raw = String(msg.content || "").toLowerCase().trim();
  logger.debug({ traceId, raw }, "🧭 [Classifier] Raw output");

  if (raw.startsWith("cypher")) return "cypher";
  if (raw.startsWith("vector")) return "vector";
  if (raw.startsWith("hybrid")) return "hybrid";

  logger.warn(
    { traceId, raw },
    "🧭 [Classifier] Unknown route → defaulting to cypher"
  );
  return "cypher";
}

// ------------------------------
// Agent 2: Cypher Agent
// ------------------------------
async function runCypherAgent(question, traceId) {
  logger.info({ traceId, question }, "📘 [Cypher] Agent started");

  try {
    logger.debug({ traceId, question }, "📘 [Cypher] Calling askGraph()");
    const { cypher, result, rawOutput } = await askGraph(question, traceId);

    const recordCount = Array.isArray(result)
      ? result.length
      : result?.records?.length ?? 0;

    logger.debug(
      { traceId, cypher, recordCount },
      "📘 [Cypher] Query executed"
    );

    return {
      ok: true,
      cypher,
      result,
      rawOutput,
    };
  } catch (err) {
    logger.error({ traceId, err }, "❌ [Cypher] Agent failed");
    return { ok: false, error: err.message };
  }
}

// ------------------------------
// Agent 3: Vector Agent
// ------------------------------
async function runVectorAgent(question, traceId) {
  logger.info({ traceId, question }, "🔍 [Vector] Semantic search started");

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

    const startups = startupRes.data?.Get?.Startup ?? [];
    const investors = investorRes.data?.Get?.Investor ?? [];

    logger.debug(
      {
        traceId,
        startupCount: startups.length,
        investorCount: investors.length,
      },
      "🔍 [Vector] Results received"
    );

    return {
      ok: true,
      startups,
      investors,
    };
  } catch (err) {
    logger.error({ traceId, err }, "❌ [Vector] Agent failed");
    return { ok: false, error: err.message };
  }
}

// ------------------------------
// Agent 4: Answer Agent
// ------------------------------
async function runAnswerAgent({ question, route, cypherData, vectorData, traceId }) {
  logger.info({ traceId, question, route }, "🧠 [Answer] Synthesizing response");

  const systemPrompt = `
Return JSON with:
"answer": "...",
"explanation": "..."
`;

  const payload = {
    question,
    route,
    cypherData: cypherData?.ok ? cypherData.result : null,
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
    return parsed;
  } catch {
    logger.warn({ traceId }, "🧠 [Answer] Model returned non-JSON, falling back");
    return {
      answer: text,
      explanation: "Model returned plain text; no JSON format.",
    };
  }
}

// ------------------------------
// Orchestrator
// ------------------------------
export async function runMultiAgentQuery(question, traceId = null) {
  logger.info({ traceId, question }, "📌 Orchestrator started");

  const tClassifier = agentDuration.startTimer({ agent: "classifier" });
  const route = await classifyRoute(question, traceId);
  tClassifier();

  let cypherData = null;
  let vectorData = null;

  if (route === "cypher") {
    const t = agentDuration.startTimer({ agent: "cypher" });
    cypherData = await runCypherAgent(question, traceId);
    t();
  }

  if (route === "vector") {
    const t = agentDuration.startTimer({ agent: "vector" });
    vectorData = await runVectorAgent(question, traceId);
    t();
  }

  if (route === "hybrid") {
    const t1 = agentDuration.startTimer({ agent: "cypher" });
    const t2 = agentDuration.startTimer({ agent: "vector" });

    [cypherData, vectorData] = await Promise.all([
      runCypherAgent(question, traceId),
      runVectorAgent(question, traceId),
    ]);

    t1();
    t2();
  }

  const tAnswer = agentDuration.startTimer({ agent: "answer" });
  const answerObj = await runAnswerAgent({
    question,
    route,
    cypherData,
    vectorData,
    traceId,
  });
  tAnswer();

  logger.info({ traceId, route }, "📌 Orchestrator complete");

  return {
    question,
    route,
    ...answerObj,
    cypher: cypherData?.cypher ?? null,
    cypherResult: cypherData?.result ?? null,
    vectorResult: vectorData ?? null,
  };
}
