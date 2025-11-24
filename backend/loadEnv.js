import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// PROJECT ROOT = backend/../
const envPath = path.resolve(__dirname, "../.env");

dotenv.config({ path: envPath });

console.log("Loaded .env from:", envPath);
