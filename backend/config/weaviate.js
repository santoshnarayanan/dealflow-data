// backend/config/weaviate.js
import "../loadEnv.js";
import weaviate from "weaviate-ts-client";
import { logger } from "../logger.js";

import { PERF_THRESHOLDS } from "../config/perfThresholds.js";


const WEAVIATE_HOST = process.env.WEAVIATE_HOST || "localhost:8080";
const WEAVIATE_SCHEME = process.env.WEAVIATE_SCHEME || "http";

logger.info(
  {
    host: WEAVIATE_HOST,
    scheme: WEAVIATE_SCHEME,
  },
  "📦 Initializing Weaviate client"
);

export const weaviateClient = weaviate.client({
  scheme: WEAVIATE_SCHEME,
  host: WEAVIATE_HOST,
  headers: {
    "X-OpenAI-Api-Key": process.env.OPENAI_API_KEY || "",
  },
});

// ---------- Generic Vector Search With Logging ---------- //

export async function vectorSearch({ className, concepts, limit = 5, fields }) {
  logger.info(
    { className, concepts, limit },
    "🔎 Weaviate vectorSearch() called"
  );

  try {
    const query = weaviateClient.graphql
      .get()
      .withClassName(className)
      .withFields(
        fields ||
        `_additional { distance } 
           name 
           description`
      )
      .withNearText({ concepts })
      .withLimit(limit);

    // ---- F5: slow Weaviate query detection ----
    const startTime = Date.now();

    const result = await query.do();

    const durationMs = Date.now() - startTime;

    if (durationMs > PERF_THRESHOLDS.weaviateMs) {   // you can tune this threshold
      logger.warn(
        { className, durationMs },
        "⚠️ Slow Weaviate vector search detected"
      );
    }

    logger.info(
      {
        className,
        count: result?.data?.Get?.[className]?.length ?? 0,
      },
      "📥 Weaviate vector search completed"
    );

    return result.data.Get[className] || [];
  } catch (err) {
    logger.error({ err, className, concepts }, "❌ Weaviate vector search failed");
    throw err;
  }
}

// ---------- Startup Search ---------- //

export async function vectorSearchStartups(question, limit = 5) {
  return vectorSearch({
    className: "Startup",
    concepts: [question],
    limit,
    fields: `
      name
      industry
      description
      _additional { distance }
    `,
  }).then((items) =>
    items.map((item) => ({
      type: "Startup",
      name: item.name,
      industry: item.industry,
      description: item.description,
      distance: item._additional?.distance ?? null,
    }))
  );
}

// ---------- Investor Search ---------- //

export async function vectorSearchInvestors(question, limit = 5) {
  return vectorSearch({
    className: "Investor",
    concepts: [question],
    limit,
    fields: `
      name
      type
      description
      _additional { distance }
    `,
  }).then((items) =>
    items.map((item) => ({
      type: "Investor",
      name: item.name,
      investorType: item.type,
      description: item.description,
      distance: item._additional?.distance ?? null,
    }))
  );
}
