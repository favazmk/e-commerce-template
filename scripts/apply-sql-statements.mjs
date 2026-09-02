/**
 * Split a .sql file into one file per statement, so each can be applied
 * individually with `supabase db query -f <file>`.
 *
 * Why this exists:
 *   - `supabase db query` sends a prepared statement, which cannot carry
 *     multiple commands, so the migration cannot be piped in as one file.
 *   - The Supabase CLI is the only client here that trusts Supabase's TLS CA,
 *     so we go through it rather than disabling certificate verification.
 *   - Node cannot spawn `npx.cmd` on Windows without a shell (EINVAL), and
 *     passing SQL through a shell invites quoting bugs — hence files, applied
 *     by a caller-side loop.
 *
 * Every statement in the hardening migration is idempotent (ENABLE ROW LEVEL
 * SECURITY is a no-op when already on, policies are dropped before creation,
 * and the users policy is guarded by a DO block), so a partial run is safe to
 * re-run rather than needing a transaction spanning invocations.
 *
 * Usage: node scripts/apply-sql-statements.mjs <file.sql> --split-to <dir>
 */
import fs from "fs";
import path from "path";

const file = process.argv[2];
const flagIndex = process.argv.indexOf("--split-to");
const outDir = flagIndex > -1 ? process.argv[flagIndex + 1] : null;

if (!file || !outDir) {
  console.error("Usage: node scripts/apply-sql-statements.mjs <file.sql> --split-to <dir>");
  process.exit(1);
}

/**
 * Split SQL on semicolons, respecting line comments, single-quoted strings and
 * dollar-quoted blocks ($$ ... $$) so a DO block stays a single statement.
 */
function splitStatements(sql) {
  const out = [];
  let buf = "";
  let i = 0;
  let inLineComment = false;
  let inSingle = false;
  let dollarTag = null;

  while (i < sql.length) {
    const ch = sql[i];
    const rest = sql.slice(i);

    if (inLineComment) {
      if (ch === "\n") inLineComment = false;
      buf += ch;
      i++;
      continue;
    }
    if (dollarTag) {
      if (rest.startsWith(dollarTag)) {
        buf += dollarTag;
        i += dollarTag.length;
        dollarTag = null;
        continue;
      }
      buf += ch;
      i++;
      continue;
    }
    if (inSingle) {
      if (ch === "'") inSingle = false;
      buf += ch;
      i++;
      continue;
    }
    if (rest.startsWith("--")) {
      inLineComment = true;
      buf += ch;
      i++;
      continue;
    }
    if (ch === "'") {
      inSingle = true;
      buf += ch;
      i++;
      continue;
    }
    const dq = rest.match(/^\$[A-Za-z_]*\$/);
    if (dq) {
      dollarTag = dq[0];
      buf += dollarTag;
      i += dollarTag.length;
      continue;
    }
    if (ch === ";") {
      out.push(buf.trim());
      buf = "";
      i++;
      continue;
    }
    buf += ch;
    i++;
  }
  if (buf.trim()) out.push(buf.trim());

  // Drop entries that are only comments or whitespace.
  return out.filter((s) => {
    const code = s
      .split("\n")
      .filter((l) => !l.trim().startsWith("--"))
      .join("\n")
      .trim();
    return code.length > 0;
  });
}

/** One-line label for progress output. */
function label(stmt) {
  const code = stmt
    .split("\n")
    .filter((l) => !l.trim().startsWith("--"))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  return code.length > 88 ? code.slice(0, 85) + "..." : code;
}

const statements = splitStatements(fs.readFileSync(path.resolve(process.cwd(), file), "utf8"));

fs.mkdirSync(outDir, { recursive: true });
for (const f of fs.readdirSync(outDir)) {
  if (/^\d{3}\.sql$/.test(f)) fs.unlinkSync(path.join(outDir, f));
}

statements.forEach((stmt, i) => {
  const name = String(i + 1).padStart(3, "0") + ".sql";
  fs.writeFileSync(path.join(outDir, name), stmt + "\n", "utf8");
  console.log("  " + name + "  " + label(stmt));
});

console.log("\n" + statements.length + " statement(s) written to " + outDir);
