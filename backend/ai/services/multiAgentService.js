import { ChatOpenAI } from "@langchain/openai";
import { weaviateClient } from "../../config/weaviate.js";
import { askGraph } from "./langchainService.js";
import { logger } from "../../logger.js";
import { agentDuration } from "../../metrics/metrics.js";

// LLM instance
const llm = new ChatOpenAI({
  modelName: "gpt-4o-mini",
  temperature: 0,
  openAIApiKey: process.env.OPENAI_API_KEY,
});

// ------------------------------
// Agent 1: Routing classifier
// ------------------------------
async function classifyRoute(question) {
  logger.info({ question }, "🧭 Classifier: routing decision");
  logger.debug({ question }, "🧭 [Classifier] Deciding route...");

  const systemPrompt = `
You are a routing assistant. Return only:
cypher
vector
hybrid
(no punctuation)
`;

  const msg = await llm.invoke([
    { role: "system", content: systemPrompt },
    { role: "user", content: question }
  ]);

  const raw = String(msg.content || "").toLowerCase().trim();
  logger.debug({ raw }, "🧭 [Classifier] Raw output");

  if (raw.startsWith("cypher")) return "cypher";
  if (raw.startsWith("vector")) return "vector";
  if (raw.startsWith("hybrid")) return "hybrid";

  logger.warn({ raw }, "🧭 [Classifier] Unknown route → defaulting to cypher");
  return "cypher";
}

// ------------------------------
// Agent 2: Cypher Agent
// ------------------------------
async function runCypherAgent(question) {
  logger.info({ question }, "📘 [Cypher] Agent started");

  try {
    logger.debug({ question }, "📘 [Cypher] Calling askGraph()");
    const { cypher, result, rawOutput } = await askGraph(question);

    logger.debug(
      { cypher, recordCount: result?.length ?? 0 },
      "📘 [Cypher] Query executed"
    );

    return {
      ok: true,
      cypher,
      result,
      rawOutput
    };
  } catch (err) {
    logger.error({ err }, "❌ [Cypher] Agent failed");
    return { ok: false, error: err.message };
  }
}

// ------------------------------
// Agent 3: Vector Agent
// ------------------------------
async function runVectorAgent(question) {
  logger.info({ question }, "🔍 [Vector] Semantic search started");

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
      { startupCount: startups.length, investorCount: investors.length },
      "🔍 [Vector] Results received"
    );

    return {
      ok: true,
      startups,
      investors
    };
  } catch (err) {
    logger.error({ err }, "❌ [Vector] Agent failed");
    return { ok: false, error: err.message };
  }
}

// ------------------------------
// Agent 4: Answer Agent
// ------------------------------
async function runAnswerAgent({ question, route, cypherData, vectorData }) {
  logger.info({ question, route }, "🧠 [Answer] Synthesizing response");

  const systemPrompt = `
Return JSON with:
"answer": "...",
"explanation": "..."
`;

  const payload = {
    question,
    route,
    cypherData: cypherData?.ok ? cypherData.result : null,
    vectorData: vectorData?.ok ? vectorData : null
  };

  const msg = await llm.invoke([
    { role: "system", content: systemPrompt },
    { role: "user", content: JSON.stringify(payload, null, 2) }
  ]);

  const text = String(msg.content || "").trim();

  try {
    const parsed = JSON.parse(text);
    logger.debug({}, "🧠 [Answer] JSON parsed successfully");
    return parsed;
  } catch {
    logger.warn({}, "🧠 [Answer] Model returned non-JSON, falling back");
    return {
      answer: text,
      explanation: "Model returned plain text; no JSON format."
    };
  }
}

// ------------------------------
// Orchestrator
// ------------------------------
export async function runMultiAgentQuery(question) {
  logger.info({ question }, "📌 Orchestrator started");

  // 1. Classify
  const t1 = agentDuration.startTimer({ agent: "classifier" });
  const route = await classifyRoute(question);
  t1();

  let cypherData = null;
  let vectorData = null;

  // 2. Run selected path
  if (route === "cypher") {
    const t = agentDuration.startTimer({ agent: "cypher" });
    cypherData = await runCypherAgent(question);
    t();
  }

  if (route === "vector") {
    const t = agentDuration.startTimer({ agent: "vector" });
    vectorData = await runVectorAgent(question);
    t();
  }

  if (route === "hybrid") {
    const t1 = agentDuration.startTimer({ agent: "cypher" });
    const t2 = agentDuration.startTimer({ agent: "vector" });

    [cypherData, vectorData] = await Promise.all([
      runCypherAgent(question),
      runVectorAgent(question)
    ]);

    t1();
    t2();
  }

  // 3. Answer Agent
  const t3 = agentDuration.startTimer({ agent: "answer" });
  const answerObj = await runAnswerAgent({
    question,
    route,
    cypherData,
    vectorData
  });
  t3();

  logger.info({ route }, "📌 Orchestrator complete");

  return {
    question,
    route,
    ...answerObj,
    cypher: cypherData?.cypher ?? null,
    cypherResult: cypherData?.result ?? null,
    vectorResult: vectorData ?? null
  };
}
