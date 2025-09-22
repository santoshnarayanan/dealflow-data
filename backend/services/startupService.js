import driver from "../config/neo4j.js";
import neo4j from "neo4j-driver";

export async function getStartups(limit = 20) {
  const session = driver.session();
  try {
    const result = await session.run(
      "MATCH (s:Startup) RETURN s LIMIT $limit",
      { limit: neo4j.int(limit) } //  Force integer. Neo4j’s LIMIT requires a pure integer, not a float.
    );
    return result.records.map((r) => r.get("s").properties);
  } finally {
    await session.close();
  }
}

export async function searchStartupsByIndustry(industry) {
  if (!industry) {
    throw new Error("Industry parameter is required");
  }

  const session = driver.session();
  try {
    const result = await session.run(
      `MATCH (s:Startup)
       WHERE toLower(s.industry) = toLower($industry)
       RETURN s`,
      { industry }
    );
    return result.records.map((r) => r.get("s").properties);
  } finally {
    await session.close();
  }
}
