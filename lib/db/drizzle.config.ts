import { defineConfig } from "drizzle-kit";
import { existsSync } from "fs";
import path from "path";

// Load the repo-root .env for local runs (Docker passes env vars directly).
const rootEnv = path.join(__dirname, "..", "..", ".env");
if (!process.env.DATABASE_URL && existsSync(rootEnv)) {
  process.loadEnvFile(rootEnv);
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set (see .env.example)");
}

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
