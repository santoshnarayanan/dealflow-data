// backend/routes/vector.js
import express from "express";
import {
  vectorSearchStartups,
  vectorSearchInvestors,
} from "../config/weaviate.js";

const router = express.Router();

/**
 * GET /vector/startups?q=...
 */
router.get("/startups", async (req, res) => {
  try {
    const q = req.query.q || "";
    if (!q) {
      return res.status(400).json({ error: "Query parameter 'q' is required" });
    }
    const items = await vectorSearchStartups(q, 10);
    res.json({ query: q, items });
  } catch (err) {
    console.error("❌ /vector/startups error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * GET /vector/investors?q=...
 */
router.get("/investors", async (req, res) => {
  try {
    const q = req.query.q || "";
    if (!q) {
      return res.status(400).json({ error: "Query parameter 'q' is required" });
    }
    const items = await vectorSearchInvestors(q, 10);
    res.json({ query: q, items });
  } catch (err) {
    console.error("❌ /vector/investors error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
