import { defineConfig } from "vitest/config";
import path from "path";
import fs from "fs";

const projectDir = process.cwd();
const envLocalPath = path.resolve(projectDir, ".env.local");
if (fs.existsSync(envLocalPath)) {
  const envConfig = fs.readFileSync(envLocalPath, "utf-8");
  envConfig.split("\n").forEach((line) => {
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
    testTimeout: 20000,
    exclude: ["**/node_modules/**", "**/dist/**", "**/tests/e2e/**"],
    setupFiles: ["./tests/setupEnv.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
