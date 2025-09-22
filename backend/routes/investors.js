import express from "express";
import { getInvestors } from "../services/investorService.js";

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const investors = await getInvestors();
    res.json(investors);
  } catch (err) {
    next(err);
  }
});

export default router;
