import { defineConfig } from "drizzle-kit";

const connectionString =
  process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL ?? "";

if (!connectionString) {
  console.warn(
    "drizzle.config.ts: define DATABASE_URL or DIRECT_DATABASE_URL before running Drizzle commands.",
  );
}

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: connectionString,
  },
});
