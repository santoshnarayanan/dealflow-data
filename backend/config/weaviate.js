// backend/config/weaviate.js
import "../loadEnv.js";
import weaviate from "weaviate-ts-client";

const WEAVIATE_HOST = process.env.WEAVIATE_HOST || "localhost:8080";
const WEAVIATE_SCHEME = process.env.WEAVIATE_SCHEME || "http";

export const weaviateClient = weaviate.client({
  scheme: WEAVIATE_SCHEME,
  host: WEAVIATE_HOST,
  headers: {
    // Needed for text2vec-openai in Weaviate
    "X-OpenAI-Api-Key": process.env.OPENAI_API_KEY || "",
  },
});

/**
 * Generic vector search helper for a given class.
 */
export async function vectorSearch({
  className,
  concepts,
  limit = 5,
  fields,
}) {
  if (!concepts || !concepts.length) {
    throw new Error("concepts array is required for vectorSearch");
  }

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

  const result = await query.do();

  return result.data.Get[className] || [];
}

/**
 * Convenience helpers for Startup / Investor.
 */
export async function vectorSearchStartups(question, limit = 5) {
  const items = await vectorSearch({
    className: "Startup",
    concepts: [question],
    limit,
    fields: `
      name
      industry
      description
      _additional { distance }
    `,
  });

  return items.map((item) => ({
    type: "Startup",
    name: item.name,
    industry: item.industry,
    description: item.description,
    distance: item._additional?.distance ?? null,
  }));
}

export async function vectorSearchInvestors(question, limit = 5) {
  const items = await vectorSearch({
    className: "Investor",
    concepts: [question],
    limit,
    fields: `
      name
      type
      description
      _additional { distance }
    `,
  });

  return items.map((item) => ({
    type: "Investor",
    name: item.name,
    investorType: item.type,
    description: item.description,
    distance: item._additional?.distance ?? null,
  }));
}
