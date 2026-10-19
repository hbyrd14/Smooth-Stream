import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// Dev server port (the API server runs separately, see API_URL below).
const port = Number(process.env.PORT ?? 5173);
if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${process.env.PORT}"`);
}

// Public path the app is served under. Use "/" unless you mount SmoothStream
// under a sub-path behind a reverse proxy (e.g. "/smoothstream/").
const basePath = process.env.BASE_PATH ?? "/";

// Where the dev server forwards /api requests. In production the API server
// serves the built frontend itself, so no proxy is involved.
const apiUrl = process.env.API_URL ?? "http://localhost:8080";

// Extra hostnames the dev/preview server will answer to (comma-separated),
// e.g. "smoothstream.lan,stream.example.com". Localhost is always allowed.
const allowedHosts = (process.env.ALLOWED_HOSTS ?? "")
  .split(",")
  .map((h) => h.trim())
  .filter(Boolean);

const apiProxy = {
  "/api": { target: apiUrl, changeOrigin: true },
};

export default defineConfig({
  base: basePath,
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port,
    host: "0.0.0.0",
    allowedHosts,
    proxy: apiProxy,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts,
    proxy: apiProxy,
  },
});
