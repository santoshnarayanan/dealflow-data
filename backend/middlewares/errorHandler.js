// backend/middlewares/errorHandler.js
import { logger } from "../logger.js";

export function errorHandler(err, req, res, next) {
  logger.error(
    {
      err,
      path: req.path,
      method: req.method,
    },
    "❌ Unhandled error"
  );

  if (res.headersSent) {
    return next(err);
  }

  res.status(500).json({ error: "Internal Server Error" });
}
