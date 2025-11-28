import neo4j from "neo4j-driver";
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve("../.env") });

console.log("🔍 Using credentials:");
console.log({
  uri: process.env.NEO4J_URI,
  username: process.env.NEO4J_USERNAME,
  password: process.env.NEO4J_PASSWORD ? "Loaded ✅" : "Missing ❌"
});

const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD)
);

try {
  const session = driver.session({ database: process.env.NEO4J_DATABASE });
  const result = await session.run("RETURN 'Connection OK' AS msg");
  console.log("✅ Neo4j says:", result.records[0].get("msg"));
  await session.close();
} catch (err) {
  console.error("❌ Connection failed:", err.message);
} finally {
  await driver.close();
}
