import crypto from "crypto";

export function createTraceId() {
  return crypto.randomBytes(8).toString("hex");
}
