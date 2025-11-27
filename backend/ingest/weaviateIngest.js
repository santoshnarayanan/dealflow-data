import weaviate from "weaviate-ts-client";
import dotenv from "dotenv";
dotenv.config();

// Create client
const client = weaviate.client({
  scheme: "http",
  host: "localhost:8080",
  headers: {
    "X-OpenAI-Api-Key": process.env.OPENAI_API_KEY
  }
});

// Example startup data
const startups = [
  {
    name: "Stripe",
    industry: "Fintech",
    description: "Stripe provides modern financial infrastructure."
  }
];

async function ingestStartups() {
  for (const item of startups) {
    const res = await client.data
      .creator()
      .withClassName("Startup")
      .withProperties(item)
      .do();

    console.log("Inserted:", res);
  }

  console.log("✅ Startup ingestion complete");
}

ingestStartups();
