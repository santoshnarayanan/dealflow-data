// backend/ai/services/multiAgentService.js

import { StateGraph, END } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";

import {
  askGraph,
  askRag
} from "./langchainService.js";

import { logger } from "../../logger.js";

/**
 * LLM used for routing.
 */
const routerLLM = new ChatOpenAI({
  model: "gpt-4o-mini",
  temperature: 0
});

/**
 * Classifier agent
 * Decides which tool to use:
 * - graph
 * - vector
 * - hybrid
 */
async function classifyRoute(question) {

  const prompt = `
You are a router for a venture capital knowledge system.

Decide the best data source for the question.

Return ONLY one of these words:
graph
vector
hybrid

Rules:

graph:
Use for relationship queries like:
- investors of a startup
- funding rounds
- who invested in X

vector:
Use for semantic searches like:
- find startups in fintech
- companies working in AI

hybrid:
Use when both graph relationships and semantic info may help.

Question:
${question}
`;

  const response = await routerLLM.invoke(prompt);

  const route = response.content.trim().toLowerCase();

  if (route.includes("graph")) return "graph";
  if (route.includes("vector")) return "vector";

  return "hybrid";
}

/**
 * Router node
 */
async function routerNode(state) {

  const route = await classifyRoute(state.question);

  logger.info({ route }, "🧭 Router selected route");

  return {
    ...state,
    route
  };
}

/**
 * Graph Agent
 */
async function graphNode(state) {

  const result = await askGraph(state.question);

  return {
    ...state,
    graphResult: result
  };
}

/**
 * Vector Agent
 */
async function vectorNode(state) {

  const result = await askRag(state.question);

  return {
    ...state,
    vectorResult: result
  };
}

/**
 * Final Answer Agent
 * Combines graph + vector results
 */
async function answerNode(state) {

  const llm = new ChatOpenAI({
    model: "gpt-4o-mini",
    temperature: 0.2
  });

  const prompt = `
You are a venture capital AI assistant.

User question:
${state.question}

Graph data:
${JSON.stringify(state.graphResult)}

Vector search data:
${JSON.stringify(state.vectorResult)}

Provide a clear final answer.
Explain reasoning briefly.
`;

  const response = await llm.invoke(prompt);

  return {
    ...state,
    answer: response.content
  };
}

/**
 * Build LangGraph workflow
 */

const graph = new StateGraph({
  channels: {
    question: "string",
    route: "string",
    graphResult: "json",
    vectorResult: "json",
    answer: "string"
  }
});

graph.addNode("router", routerNode);
graph.addNode("graph", graphNode);
graph.addNode("vector", vectorNode);
graph.addNode("answer", answerNode);

graph.setEntryPoint("router");

/**
 * Conditional routing
 */
graph.addConditionalEdges(
  "router",
  (state) => state.route,
  {
    graph: "graph",
    vector: "vector",
    hybrid: "graph"
  }
);

/**
 * Hybrid path
 */
graph.addEdge("graph", "vector");
graph.addEdge("vector", "answer");

/**
 * Graph-only
 */
graph.addEdge("graph", "answer");

/**
 * Vector-only
 */
graph.addEdge("vector", "answer");

graph.addEdge("answer", END);

const workflow = graph.compile();

/**
 * Public function used by API
 */

export async function runMultiAgentQuery(question, traceId) {

  logger.info({ traceId, question }, "🤖 LangGraph multi-agent start");

  const result = await workflow.invoke({
    question
  });

  return {
    question,
    route: result.route,
    answer: result.answer,
    graphResult: result.graphResult ?? null,
    vectorResult: result.vectorResult ?? null
  };
}