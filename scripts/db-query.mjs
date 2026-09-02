/**
 * Run a read-only SQL query against DATABASE_URL and print the rows.
 * Used to verify that a migration actually took effect in the environment.
 *
 * Usage: node scripts/db-query.mjs "select ..."
 */
import dotenv from "dotenv";
import pg from "pg";

dotenv.config({ path: ".env.local" });

const sql = process.argv[2];
if (!sql) {
  console.error('Usage: node scripts/db-query.mjs "select ..."');
  process.exit(1);
}

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  const result = await client.query(sql);
  console.table(result.rows);
} catch (error) {
  console.error("Query failed:", error.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
