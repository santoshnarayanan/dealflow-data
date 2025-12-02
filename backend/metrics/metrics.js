// backend/metrics/metrics.js
import client from "prom-client";
import os from "os";

// Create a registry
export const registry = new client.Registry();

// Default metrics (CPU, memory, event loop)
client.collectDefaultMetrics({
  register: registry,
  prefix: "dealflow_",
});

// ----------- Custom Metrics ----------- //

// Agent execution duration (histogram)
export const agentDuration = new client.Histogram({
  name: "dealflow_agent_duration_seconds",
  help: "Duration of agent execution (classifier, cypher, vector, answer)",
  labelNames: ["agent"],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
});
registry.registerMetric(agentDuration);

// Neo4j query duration
export const neo4jDuration = new client.Histogram({
  name: "dealflow_neo4j_query_seconds",
  help: "Duration of a Neo4j Cypher query",
  labelNames: ["queryName"],
  buckets: [0.005, 0.01, 0.05, 0.1, 0.3, 1],
});
registry.registerMetric(neo4jDuration);

// Weaviate search duration
export const weaviateDuration = new client.Histogram({
  name: "dealflow_weaviate_query_seconds",
  help: "Duration of a Weaviate semantic search query",
  labelNames: ["className"],
  buckets: [0.005, 0.01, 0.05, 0.1, 0.3, 1],
});
registry.registerMetric(weaviateDuration);
