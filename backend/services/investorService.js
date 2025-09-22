import driver from "../config/neo4j.js";
import neo4j from "neo4j-driver";

export async function getInvestors(limit = 10) {
  const session = driver.session();
  try {
    const result = await session.run(
      "MATCH (i:Investor) RETURN i LIMIT $limit",
      { limit: neo4j.int(limit) } // ensure integer
    );
    return result.records.map((r) => r.get("i").properties);
  } finally {
    await session.close();
  }
}
