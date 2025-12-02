// backend/config/neo4j.js
import "../loadEnv.js";
import neo4j from "neo4j-driver";
import { logger } from "../logger.js";

export const NEO4J_DATABASE = process.env.NEO4J_DATABASE || "neo4j";

logger.info(
  {
    uri: process.env.NEO4J_URI,
    db: NEO4J_DATABASE,
    user: process.env.NEO4J_USERNAME,
  },
  "📦 Initializing Neo4j driver"
);

let driver;

try {
  driver = neo4j.driver(
    process.env.NEO4J_URI,
    neo4j.auth.basic(
      process.env.NEO4J_USERNAME,
      process.env.NEO4J_PASSWORD
    ),
    {
      /* Helpful in local dev to show connectivity issues */
      connectionTimeout: 10000,
      maxConnectionPoolSize: 20,
    }
  );

  logger.info("✅ Neo4j driver created successfully");
} catch (err) {
  logger.error(
    {
      err,
      uri: process.env.NEO4J_URI,
    },
    "❌ Failed to create Neo4j driver"
  );
  throw err;
}

export default driver;
