import express from "express"
import cors from "cors";
import neo4j from "neo4j-driver";

const app = express();
app.use(cors());
app.use(express.json());

// Neo4j connection
const driver = neo4j.driver(
  process.env.NEO4J_URI || "neo4j+s://ab619e5d.databases.neo4j.io",
  neo4j.auth.basic(
    process.env.NEO4J_USERNAME || "neo4j",
    process.env.NEO4J_PASSWORD || "wc7UPtU8Aak74XJR6vAzH0jRECe22cuT_rmyLYoaf0o"
  )
);
const session = driver.session();

// Endpoints
app.get("/startups", async (req, res) => {
  const result = await session.run("MATCH (s:Startup) RETURN s LIMIT 20");
  res.json(result.records.map((r) => r.get("s").properties));
});

app.get("/investors", async (req, res) => {
  const result = await session.run("MATCH (i:Investor) RETURN i LIMIT 20");
  res.json(result.records.map((r) => r.get("i").properties));
});

app.get("/search", async (req, res) => {
  const { industry } = req.query;
  const result = await session.run(
    "MATCH (s:Startup {industry:$industry}) RETURN s",
    { industry }
  );
  res.json(result.records.map((r) => r.get("s").properties));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API running on port ${PORT}`));
