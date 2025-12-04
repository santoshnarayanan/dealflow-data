// backend/ai/services/langchainService.js
import { ChatOpenAI } from "@langchain/openai";
import { Neo4jGraph } from "@langchain/community/graphs/neo4j_graph";
import { PromptTemplate } from "@langchain/core/prompts";
import driver from "../../config/neo4j.js";
import { graphSchema } from "../config/schema.js";
import {
  vectorSearchStartups,
  vectorSearchInvestors,
} from "../../config/weaviate.js";

import { logger } from "../../logger.js";
import { neo4jDuration } from "../../metrics/metrics.js";
import { PERF_THRESHOLDS } from "../../config/perfThresholds.js";

let llm;
let graph;
let cypherPrompt;
let initialized = false;

export async function initLangChain() {
  if (initialized) return;

  console.log("🔄 Initializing LangChain...");

  graph = await Neo4jGraph.initialize({
    url: process.env.NEO4J_URI,
    username: process.env.NEO4J_USERNAME,
    password: process.env.NEO4J_PASSWORD,
    database: process.env.NEO4J_DATABASE,
    schema: graphSchema,
  });

  llm = new ChatOpenAI({
    modelName: "gpt-4o-mini",
    temperature: 0,
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

  cypherPrompt = PromptTemplate.fromTemplate(`
You are a Cypher expert. Given a question and this schema:
{schema}

Generate a Cypher query.
Question: {question}
Cypher:
`);

  initialized = true;
  console.log("✅ LangChain ready");
}

/**
 * Natural language → Cypher → Neo4j.
 */
export async function askGraph(question, traceId = null) {
  if (!initialized) {
    console.log("⚠️ LangChain not initialized. Initializing now...");
    await initLangChain();
  }

  try {
    const prompt = await cypherPrompt.format({
      schema: graphSchema,
      question,
    });

    const llmStart = Date.now();
    const cypherResponse = await llm.invoke(prompt);
    const llmDurationMs = Date.now() - llmStart;

    if (llmDurationMs > PERF_THRESHOLDS.llmMs) {
      logger.warn(
        { traceId, llmDurationMs },
        "⚠️ Slow LLM response in askGraph"
      );
    }

    const rawOutput = String(cypherResponse.content ?? "").trim();

    // Extract Cypher from markdown/code fences if present
    let cypher = rawOutput;
    const blockMatch = cypher.match(/```(?:cypher)?\s*([\s\S]*?)```/i);
    if (blockMatch) {
      cypher = blockMatch[1].trim();
    }
    const matchIndex = cypher.toUpperCase().indexOf("MATCH");
    if (matchIndex > -1) {
      cypher = cypher.slice(matchIndex).trim();
    }

    logger.debug({ traceId, cypher }, "📘 [Cypher] Executing Neo4j query...");

    const neo4jStart = Date.now();
    const endNeo4jTimer = neo4jDuration.startTimer({ queryName: "askGraph" });
    const result = await graph.query(cypher);
    endNeo4jTimer();

    const neo4jDurationMs = Date.now() - neo4jStart;
    if (neo4jDurationMs > PERF_THRESHOLDS.neo4jMs) {
      logger.warn(
        { traceId, neo4jDurationMs, cypher },
        "⚠️ Slow Neo4j query detected"
      );
    }

    const recordCount = Array.isArray(result)
      ? result.length
      : result?.records?.length ?? 0;

    logger.debug(
      { traceId, count: recordCount },
      "📘 [Cypher] Neo4j query completed"
    );

    logger.info({ traceId, cypher }, "📡 Executed Cypher query");

    return {
      question,
      rawOutput,
      cypher,
      result,
    };
  } catch (err) {
    logger.error({ traceId, err }, "❌ askGraph error");
    throw err;
  }
}

/**
 * Pure vector RAG over Weaviate (Startups + Investors).
 */
export async function askRag(question) {
  if (!initialized) {
    console.log("⚠️ LangChain not initialized. Initializing now...");
    await initLangChain();
  }

  try {
    console.log("🔎 Querying Weaviate for semantic context...");
    const [startupDocs, investorDocs] = await Promise.all([
      vectorSearchStartups(question, 3),
      vectorSearchInvestors(question, 3),
    ]);

    const allDocs = [...startupDocs, ...investorDocs];

    const contextText = allDocs
      .map((d, idx) => {
        const score =
          d.distance !== null && d.distance !== undefined
            ? ` (distance: ${d.distance.toFixed(3)})`
            : "";
        const base =
          d.type === "Startup"
            ? `Startup: ${d.name} | Industry: ${d.industry}\n${d.description}`
            : `Investor: ${d.name} | Type: ${d.investorType}\n${d.description}`;
        return `${idx + 1}. ${base}${score}`;
      })
      .join("\n\n");

    const ragPrompt = `
You are an expert assistant for a dealflow intelligence platform.

You will be given:
- A user question
- A set of retrieved context snippets about startups and investors

Use ONLY the provided context to answer as accurately as possible.
If the context is insufficient, say you are not sure and explain what is missing.

---
User question:
${question}

---
Context snippets:
${contextText || "(no context snippets were retrieved)"}

---
Answer (concise but complete):
`;

    console.log("🧠 Calling LLM with RAG context...");
    const response = await llm.invoke(ragPrompt);
    const answer =
      typeof response.content === "string"
        ? response.content
        : JSON.stringify(response.content);

    return {
      question,
      answer,
      context: allDocs,
    };
  } catch (err) {
    console.error("❌ askRag error:", err);
    throw err;
  }
}

/**
 * Hybrid: Weaviate semantic context + Neo4j graph Cypher.
 * Returns both sets of data + a synthesized answer.
 */
export async function askHybrid(question, traceId = null) {
  if (!initialized) {
    console.log("⚠️ LangChain not initialized. Initializing now...");
    await initLangChain();
  }

  try {
    // 1) Graph answer (Cypher + Neo4j rows)
    const graphResult = await askGraph(question, traceId);

    // 2) Vector answer (Startups + Investors)
    const [startupDocs, investorDocs] = await Promise.all([
      vectorSearchStartups(question, 3),
      vectorSearchInvestors(question, 3),
    ]);
    const allDocs = [...startupDocs, ...investorDocs];

    const hybridPrompt = `
You are an AI assistant for a dealflow intelligence platform.

You have:
1) Results from a Neo4j graph query (structured graph data).
2) Semantic results from a vector database (Weaviate) about startups and investors.

Your job:
- Combine both sources.
- Provide a clear, concise answer.
- Mention if any important information seems missing.

---
User question:
${question}

---
Graph (Neo4j) result (JSON):
${JSON.stringify(graphResult.result, null, 2)}

---
Vector (Weaviate) context:
${allDocs
  .map(
    (d) =>
      `${d.type}: ${d.name} - ${d.description} (distance: ${
        d.distance !== null && d.distance !== undefined
          ? d.distance.toFixed(3)
          : "n/a"
      })`
  )
  .join("\n")}

---
Final answer to the user:
`;

    const response = await llm.invoke(hybridPrompt);
    const answer =
      typeof response.content === "string"
        ? response.content
        : JSON.stringify(response.content);

    return {
      question,
      answer,
      graph: graphResult,
      vectorContext: allDocs,
    };
  } catch (err) {
    console.error("❌ askHybrid error:", err);
    throw err;
  }
}
