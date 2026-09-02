import { defineConfig } from "vitest/config";
import path from "path";
import fs from "fs";

const projectDir = process.cwd();
const envLocalPath = path.resolve(projectDir, ".env.local");
if (fs.existsSync(envLocalPath)) {
  const envConfig = fs.readFileSync(envLocalPath, "utf-8");
  // Split on /\r?\n/, not "\n": a CRLF checkout leaves a trailing \r on every
  // line, and JavaScript's `.` does not match \r, so the `(.*)$` value capture
  // below matches nothing at all and every integration test silently loses its
  // database credentials.
  envConfig.split(/\r?\n/).forEach((line) => {
    const match = line.match(/^([^#\s=]+)=(.*)$/);
    if (match) {
      process.env[match[1]] = match[2].trim().replace(/^['"](.*)['"]$/, "$1");
    }
  });
}

export default defineConfig({
  test: {
    environment: "node",
    env: process.env,
    globals: true,
    testTimeout: 30000,
    // Integration setup provisions real auth users and seed rows against a
    // hosted database; the 10s hook default is not enough for that.
    hookTimeout: 60000,
    exclude: ["**/node_modules/**", "**/dist/**", "**/tests/e2e/**"],
    setupFiles: ["./tests/setupEnv.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
