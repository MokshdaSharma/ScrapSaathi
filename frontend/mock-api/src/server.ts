import express from "express";
import cors from "cors";
import router from "./routes/index.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging in dev
app.use((req, _res, next) => {
  if (process.env.NODE_ENV !== "test") {
    console.log(`[mock-api] ${req.method} ${req.path}`);
  }
  next();
});

app.use("/", router);

// 404 fallback
app.use((_req, res) => {
  res.status(404).json({ error: { code: "NOT_FOUND", message: "Route not found" } });
});

import { expireStaleClaimsFromStore } from "./store.js";

// Background cleanup worker: auto-expire pins claimed > 45m ago every 30s
setInterval(() => {
  expireStaleClaimsFromStore();
}, 30000);

export default app;

// Start server if not running in test mode
if (process.env.NODE_ENV !== "test") {
  const PORT = parseInt(process.env.PORT ?? "4000", 10);
  app.listen(PORT, () => {
    console.log(`\n🟢 ScrapSaathi Backend API running on http://localhost:${PORT}\n`);
    console.log("  Core Endpoints:");
    console.log("  POST   /pins");
    console.log("  GET    /pins");
    console.log("  POST   /pins/:pinId/claim");
    console.log("  POST   /pins/:pinId/collect");
    console.log("  POST   /routes/optimize");
    console.log("  POST   /ratings");
    console.log("  GET    /aggregator/:id/rollup");
    console.log("  POST   /aggregator/:id/rates");
    console.log("  GET    /impact/daily");
    console.log("  POST   /__reset");
    console.log("  Auth Endpoints:");
    console.log("  POST   /api/auth/register");
    console.log("  POST   /api/auth/login");
    console.log("  POST   /api/auth/otp-request");
    console.log("  POST   /api/auth/otp-verify");
    console.log("  POST   /api/auth/demo-login");
    console.log("  GET    /api/auth/me\n");
  });
}
