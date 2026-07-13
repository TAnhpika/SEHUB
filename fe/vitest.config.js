import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react({ jsxRuntime: "automatic" })],
  esbuild: {
    jsx: "automatic",
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/__tests__/setup/vitest.setup.js"],
    include: ["src/__tests__/**/*.unit.test.js", "src/__tests__/**/*.component.test.jsx"],
    env: {
      VITE_USE_MOCK: "true",
      VITE_API_BASE_URL: "http://localhost:5006",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
