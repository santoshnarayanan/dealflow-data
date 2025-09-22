import express from "express";
import { searchStartupsByIndustry } from "../services/startupService.js";

const router = express.Router();

// GET /search?industry=Fintech
router.get("/", async (req, res, next) => {
  try {
    const { industry } = req.query;

    if (!industry) {
      return res
        .status(400)
        .json({ error: "industry query parameter is required" });
    }

    const startups = await searchStartupsByIndustry(industry);
    res.json(startups);
  } catch (err) {
    next(err);
  }
});

export default router;
