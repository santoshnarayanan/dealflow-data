// backend/test-weaviate.js

// Simple test script
// quickly test Weaviate connectivity from backend

import { searchDocumentsByQuestion } from "./config/weaviate.js";

async function main() {
  try {
    const docs = await searchDocumentsByQuestion(
      "AI startups in fintech",
      3
    );
    console.log("✅ Weaviate returned documents:");
    console.dir(docs, { depth: null });
  } catch (err) {
    console.error("❌ Weaviate test failed:", err);
  }
}

main();
