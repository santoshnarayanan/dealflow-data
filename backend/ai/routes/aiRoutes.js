// backend/ai/routes/aiRoutes.js
import express from "express";
import { askGraph } from "../services/langchainService.js";

const router = express.Router();

router.post("/ai-query", async (req, res, next) => {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ error: "Question is required" });
    }

    const { cypher, result } = await askGraph(question);

    res.json({
      question,
      cypher, // ✅ return generated Cypher query
      result, // ✅ return query result
    });
  } catch (error) {
    console.error("❌ AI route error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
