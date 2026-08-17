import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // DDL runs on Neon's direct (non-pooled) endpoint — the pooler does not
    // support the session-level operations migrations need. The application
    // itself uses the pooled DATABASE_URL via the adapter in src/lib/db.ts.
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  },
});
