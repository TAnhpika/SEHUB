import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
    dedupe: ["react", "react-dom"],
  },
  server: {
    // Mở trình duyệt hệ thống (Chrome/Edge) thay vì Simple Browser của IDE — tránh lỗi onboarding extension.
    open: "/login",
    host: true,
    port: 5173,
    strictPort: false,
  },
});
