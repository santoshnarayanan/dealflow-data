// backend/ai/services/langchainService.js
import { ChatOpenAI } from "@langchain/openai";
import { Neo4jGraph } from "@langchain/community/graphs/neo4j_graph";
import { PromptTemplate } from "@langchain/core/prompts";
import driver from "../../config/neo4j.js";
import { graphSchema } from "../config/schema.js";

let llm;
let graph;
let cypherPrompt;
let initialized = false; // ✅ track initialization state

/**
 * Initialize LangChain (Neo4j graph + OpenAI model + prompt template).
 * Runs only once, reused afterwards.
 */
export async function initLangChain() {
  if (initialized) {
    return;
  }

  console.log("🔄 Initializing LangChain...");

  graph = await Neo4jGraph.initialize({
    url: process.env.NEO4J_URI, // ✅ Aura URI (with neo4j+s://)
    username: process.env.NEO4J_USERNAME,
    password: process.env.NEO4J_PASSWORD,
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
 * Answer a natural language question by generating Cypher and querying Neo4j.
 */
export async function askGraph(question) {
  if (!initialized) {
    console.log("⚠️ LangChain not initialized. Initializing now...");
    await initLangChain();
  }

  try {
    // 1. Generate Cypher query using LLM
    const prompt = await cypherPrompt.format({
      schema: graphSchema,
      question,
    });
    const cypherResponse = await llm.invoke(prompt);
    const rawOutput = cypherResponse.content.trim(); // ✅ store original LLM response

    // 2. Clean the Cypher (strip explanations / markdown)
    let cypher = rawOutput;
    const blockMatch = cypher.match(/```(?:cypher)?\s*([\s\S]*?)```/i);
    if (blockMatch) {
      cypher = blockMatch[1].trim();
    }
    const matchIndex = cypher.indexOf("MATCH");
    if (matchIndex > -1) {
      cypher = cypher.slice(matchIndex).trim();
    }

    console.log("📝 Clean Cypher:", cypher);

    // 3. Run Cypher on Neo4j
    const result = await graph.query(cypher);

    return {
      question,
      rawOutput, // ✅ original LLM text
      cypher, // ✅ cleaned Cypher query
      result, // ✅ Neo4j query results
    };
  } catch (err) {
    console.error("❌ askGraph error:", err);
    throw err;
  }
}
