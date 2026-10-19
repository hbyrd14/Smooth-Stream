import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { existsSync } from "node:fs";
import path from "node:path";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

// Behind nginx / Caddy / Traefik / Cloudflare Tunnel, trust the proxy so
// req.ip and req.protocol reflect the real client. Set TRUST_PROXY=false
// if the server is exposed directly.
const trustProxy = process.env.TRUST_PROXY ?? "loopback, linklocal, uniquelocal";
app.set("trust proxy", trustProxy === "false" ? false : trustProxy);
app.disable("x-powered-by");

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

// The frontend is served from this same origin, so CORS is only needed when
// the UI is hosted elsewhere. Set CORS_ORIGIN to a comma-separated allowlist
// (or "*") to enable it.
const corsOrigin = process.env.CORS_ORIGIN?.trim();
if (corsOrigin) {
  app.use(
    cors({
      origin:
        corsOrigin === "*"
          ? true
          : corsOrigin.split(",").map((o) => o.trim()),
    }),
  );
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// Unknown API routes return JSON 404s instead of falling through to the SPA.
app.use("/api", (_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// ---------------------------------------------------------------------------
// Static frontend + SPA fallback
// ---------------------------------------------------------------------------
// STATIC_DIR points at the Vite build output. By default we look for the
// sibling smoothstream build relative to the bundled server (dist/index.mjs).
const staticDir = path.resolve(
  process.env.STATIC_DIR ??
    path.join(import.meta.dirname, "..", "..", "smoothstream", "dist", "public"),
);
const indexHtml = path.join(staticDir, "index.html");

if (existsSync(indexHtml)) {
  app.use(
    express.static(staticDir, {
      index: false,
      setHeaders(res, filePath) {
        // Vite fingerprints everything under /assets, so it can be cached forever.
        if (filePath.includes(`${path.sep}assets${path.sep}`)) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        }
      },
    }),
  );

  // SPA fallback: any other GET that wants HTML gets index.html so the
  // client-side router (wouter) can handle /dashboard, /events/:id, etc.
  app.use((req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") return next();
    if (!req.accepts("html")) return next();
    res.setHeader("Cache-Control", "no-cache");
    res.sendFile(indexHtml);
  });

  logger.info({ staticDir }, "Serving frontend");
} else {
  logger.warn(
    { staticDir },
    "Frontend build not found; serving API only. Run `pnpm build` or set STATIC_DIR.",
  );
}

export default app;
