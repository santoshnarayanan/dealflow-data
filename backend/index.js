import express from "express"
import cors from "cors";
import neo4j from "neo4j-driver";
import dotenv from "dotenv"

// Load environment variables
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Neo4j connection
const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(
    process.env.NEO4J_USERNAME,
    process.env.NEO4J_PASSWORD
  )
);



// Utility function for running Cypher queries
async function runQuery(cypher, params = {}) {
  const session = driver.session();
  try {
    return await session.run(cypher, params);
  } finally {
    await session.close();
  }
}

// Endpoints
app.get("/startups", async (req, res) => {
  try {
    const result = await runQuery("MATCH (s:Startup) RETURN s LIMIT 20");
    res.json(result.records.map(r => r.get("s").properties));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch startups" });
  }
});

app.get("/investors", async (req, res) => {
  try {
    const result = await runQuery("MATCH (i:Investor) RETURN i LIMIT 20");
    res.json(result.records.map(r => r.get("i").properties));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch investors" });
  }
});

app.get("/search", async (req, res) => {
  const { industry } = req.query;
  try {
    const result = await runQuery(
      "MATCH (s:Startup {industry:$industry}) RETURN s",
      { industry }
    );
    res.json(result.records.map(r => r.get("s").properties));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to search startups" });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 API running on port ${PORT}`));