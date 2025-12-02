// backend/logger.js
import pino from "pino";

const isProd = process.env.NODE_ENV === "production";

export const logger = pino({
    level: process.env.LOG_LEVEL || "info",
    transport: {
        targets: [
            {
                target: "pino-pretty",
                options: { colorize: true },
                level: "debug"
            },
            {
                target: "pino/file",
                options: { destination: "./logs/app.log" },
                level: "info"
            }
        ]
    },

});
