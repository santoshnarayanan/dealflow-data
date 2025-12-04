// backend/test-weaviate.js
import { vectorSearchStartups } from "./config/weaviate.js";

async function main() {
  try {
    const docs = await vectorSearchStartups("AI startups in fintech", 3);
    console.log("✅ Weaviate returned documents:");
    console.dir(docs, { depth: null });
  } catch (err) {
    console.error("❌ Weaviate test failed:", err);
  }
}

main();
