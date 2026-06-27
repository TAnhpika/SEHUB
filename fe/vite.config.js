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
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/react-dom") || id.includes("node_modules/react/") || id.includes("node_modules/react-router-dom")) {
            return "react";
          }
          if (id.includes("node_modules/recharts")) {
            return "recharts";
          }
          if (id.includes("node_modules/@microsoft/signalr")) {
            return "signalr";
          }
          return undefined;
        },
      },
    },
  },
  server: {
    // Mở trình duyệt hệ thống (Chrome/Edge) thay vì Simple Browser của IDE — tránh lỗi onboarding extension.
    open: "/",
    host: true,
    port: 5173,
    // Giữ cố định 5173 để khớp Authorized JavaScript origins trên Google Cloud Console.
    strictPort: true,
    // GIS popup (ux_mode: popup) cần COOP này — tránh lỗi postMessage và token không hợp lệ.
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
    },
  },
});
