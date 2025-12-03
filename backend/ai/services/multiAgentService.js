// backend/ai/services/multiAgentService.js

import { ChatOpenAI } from "@langchain/openai";
import { weaviateClient } from "../../config/weaviate.js";
import { askGraph } from "./langchainService.js";
import { logger } from "../../logger.js";
import { agentDuration } from "../../metrics/metrics.js";

// LLM
const llm = new ChatOpenAI({
  modelName: "gpt-4o-mini",
  temperature: 0,
  openAIApiKey: process.env.OPENAI_API_KEY,
});

// ------------------------------
// Agent 1: Routing classifier
// ------------------------------
async function classifyRoute(question) {
  logger.info({ question }, "🧭 Classifier decision");

  const systemPrompt = `
You are a routing assistant. Return only one word:
"cypher", "vector", or "hybrid".
`;

  const msg = await llm.invoke([
    { role: "system", content: systemPrompt },
    { role: "user", content: question },
  ]);

  const raw = String(msg.content || "").trim().toLowerCase();

  if (raw.startsWith("cypher")) return "cypher";
  if (raw.startsWith("vector")) return "vector";
  if (raw.startsWith("hybrid")) return "hybrid";

  return "cypher";
}

// ------------------------------
// Agent 2: Cypher / Neo4j agent
// ------------------------------
async function runCypherAgent(question) {
  try {
    const { cypher, result, rawOutput } = await askGraph(question);

    return {
      ok: true,
      cypher,
      result,
      rawOutput,
    };
  } catch (err) {
    logger.error({ err }, "❌ Cypher agent failed");
    return { ok: false, error: err.message };
  }
}

// ------------------------------
// Agent 3: Vector / Weaviate agent
// ------------------------------
async function runVectorAgent(question) {
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

    const startups = startupRes.data?.Get?.Startup || [];
    const investors = investorRes.data?.Get?.Investor || [];

    return {
      ok: true,
      startups,
      investors,
    };
  } catch (err) {
    logger.error({ err }, "❌ Vector agent failed");
    return { ok: false, error: err.message };
  }
}

// ------------------------------
// Agent 4: Answer synthesis agent
// ------------------------------
async function runAnswerAgent({ question, route, cypherData, vectorData }) {
  const systemPrompt = `
Respond ONLY in valid JSON:
{
  "answer": "...",
  "explanation": "..."
}
`;

  const payload = {
    question,
    route,
    cypherData: cypherData?.ok ? cypherData.result : null,
    vectorData: vectorData?.ok
      ? {
          startups: vectorData.startups,
          investors: vectorData.investors,
        }
      : null,
  };

  const msg = await llm.invoke([
    { role: "system", content: systemPrompt },
    { role: "user", content: JSON.stringify(payload, null, 2) },
  ]);

  const text = String(msg.content || "").trim();

  try {
    const parsed = JSON.parse(text);
    return {
      answer: parsed.answer,
      explanation: parsed.explanation,
    };
  } catch {
    return {
      answer: text,
      explanation: "Model returned non-JSON. Using raw text.",
    };
  }
}

// ------------------------------
// Main Orchestrator
// ------------------------------
export async function runMultiAgentQuery(question) {
  // 1) Routing
  const t1 = agentDuration.startTimer({ agent: "classifier" });
  const route = await classifyRoute(question);
  t1();

  let cypherData = null;
  let vectorData = null;

  // 2) Run selected agents
  if (route === "cypher") {
    const t = agentDuration.startTimer({ agent: "cypher" });
    cypherData = await runCypherAgent(question);
    t();
  } else if (route === "vector") {
    const t = agentDuration.startTimer({ agent: "vector" });
    vectorData = await runVectorAgent(question);
    t();
  } else if (route === "hybrid") {
    const t = agentDuration.startTimer({ agent: "cypher" });
    const t2 = agentDuration.startTimer({ agent: "vector" });

    [cypherData, vectorData] = await Promise.all([
      runCypherAgent(question),
      runVectorAgent(question),
    ]);

    t();
    t2();
  }

  // 3) Synthesize answer
  const t3 = agentDuration.startTimer({ agent: "answer" });
  const { answer, explanation } = await runAnswerAgent({
    question,
    route,
    cypherData,
    vectorData,
  });
  t3();

  // 4) Return full structured response
  return {
    question,
    route,
    answer,
    explanation,
    cypher: cypherData?.cypher ?? null,
    cypherResult: cypherData?.ok ? cypherData.result : null,
    vectorResult: vectorData?.ok
      ? {
          startups: vectorData.startups,
          investors: vectorData.investors,
        }
      : null,
  };
}
