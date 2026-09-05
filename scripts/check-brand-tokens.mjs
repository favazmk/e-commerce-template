/**
 * Fail the build when a storefront component hardcodes a framework palette
 * colour instead of a brand token.
 *
 * Why this exists as a check rather than a convention:
 *
 * The engine ships a full set of brand CSS variables, and a client store
 * rebrands by setting them. A component that writes `bg-rose-600` opts out of
 * that silently — the token still resolves, it is simply never read, so the
 * store renders the framework's accent no matter what the client configured.
 * Nothing fails, no test breaks, and the defect is only visible to someone
 * looking at the rendered page in the client's own palette.
 *
 * That failure mode was found in production across four separate components
 * (a discount badge, cart counters, rating stars, a password-strength meter),
 * every one of them invisible from the theme configuration.
 *
 * Admin pages are exempt: they are internal tooling with a fixed look, not
 * client-facing surface.
 *
 * Usage: node scripts/check-brand-tokens.mjs
 */
import fs from "node:fs";
import path from "node:path";

const ROOTS = ["src/components/storefront", "src/components/ui", "src/app/(storefront)"];

/** Tailwind palette families that must never appear in client-facing markup. */
const PALETTE =
  "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose";

/** bg-rose-600, text-amber-400, fill-lime-500, border-red-200, ring-blue-500 … */
const OFFENDER = new RegExp(`\\b(?:bg|text|fill|stroke|border|ring|from|via|to)-(?:${PALETTE})-\\d{2,3}\\b`, "g");

/** What to reach for instead, so the error is actionable rather than a scold. */
const SUGGESTIONS = [
  [/-(?:rose|red)-(?:[5-9]\d{2})\b/, "--brand-danger (text-brand-danger)"],
  [/-(?:rose|red)-(?:50|100|200)\b/, "--brand-danger-surface / --brand-danger-border"],
  [/-(?:amber|yellow|orange)-(?:[5-9]\d{2})\b/, "--brand-warning (text-brand-warning)"],
  [/-(?:amber|yellow|orange)-(?:50|100|200)\b/, "--brand-warning-surface / --brand-warning-border"],
  [/-(?:green|emerald|teal|lime)-/, "--brand-success or --brand-rating"],
  [/-(?:slate|gray|zinc|neutral|stone)-/, "--brand-ink / --brand-muted-ink / --brand-border"],
];

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(tsx|ts)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const findings = [];
for (const root of ROOTS) {
  for (const file of walk(root)) {
    const lines = fs.readFileSync(file, "utf8").split("\n");
    lines.forEach((line, i) => {
      for (const match of line.matchAll(OFFENDER)) {
        const hint = SUGGESTIONS.find(([re]) => re.test(match[0]))?.[1] ?? "a --brand-* token";
        findings.push({ file: file.replace(/\\/g, "/"), line: i + 1, cls: match[0], hint });
      }
    });
  }
}

if (findings.length === 0) {
  console.log("brand tokens: no hardcoded palette classes in client-facing components");
  process.exit(0);
}

console.error(
  `\n${findings.length} hardcoded palette class${findings.length === 1 ? "" : "es"} in client-facing components.\n` +
    `These ignore the store's configured brand and will not re-theme.\n`
);
for (const f of findings) {
  console.error(`  ${f.file}:${f.line}  ${f.cls}`);
  console.error(`      use ${f.hint}`);
}
console.error("");
process.exit(1);
