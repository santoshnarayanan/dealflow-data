import express from "express";
import {
  getStartups,
  searchStartupsByIndustry,
} from "../services/startupService.js";

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const startups = await getStartups();
    res.json(startups);
  } catch (err) {
    next(err);
  }
});

router.get("/search", async (req, res, next) => {
  try {
    const { industry } = req.query;
    const startups = await searchStartupsByIndustry(industry);
    res.json(startups);
  } catch (err) {
    next(err);
  }
});

export default router;
