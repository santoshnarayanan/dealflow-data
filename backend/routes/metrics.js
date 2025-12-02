import express from "express";
import { registry } from "../metrics/metrics.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    res.set("Content-Type", registry.contentType);
    const metrics = await registry.metrics();
    res.send(metrics);
  } catch (err) {
    res.status(500).send("Failed to collect metrics");
  }
});

export default router;
