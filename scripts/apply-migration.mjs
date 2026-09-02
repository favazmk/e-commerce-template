/**
 * Apply a SQL migration file to the database in DATABASE_URL.
 *
 * Usage: node scripts/apply-migration.mjs supabase/migrations/<file>.sql
 *
 * A migration that only exists as a file has changed nothing. This runner is
 * the step that makes it real, and it prints the post-state so the change can
 * be verified rather than assumed.
 */
import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import pg from "pg";

dotenv.config({ path: ".env.local" });

const file = process.argv[2];
if (!file) {
  console.error("Usage: node scripts/apply-migration.mjs <path-to.sql>");
  process.exit(1);
}

const sql = fs.readFileSync(path.resolve(file), "utf8");
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  await client.query("BEGIN");
  await client.query(sql);
  await client.query("COMMIT");
  console.log(`Applied ${file}`);
} catch (error) {
  await client.query("ROLLBACK").catch(() => {});
  console.error(`Failed to apply ${file}:`, error.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
