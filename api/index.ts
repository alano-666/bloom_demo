import type { IncomingMessage, ServerResponse } from "node:http";

let appPromise: Promise<any> | null = null;

function loadApp() {
  appPromise ??= import("../apps/api/dist/index.js").then((module) => module.app);
  return appPromise;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.url === "/api/health" || req.url === "/api/health/") {
    try {
      await loadApp();
      res.setHeader("content-type", "application/json; charset=utf-8");
      res.end(JSON.stringify({
        ok: true,
        runtime: "vercel-node",
        appLoaded: true,
        storage: process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY ? "supabase" : "not-configured",
      }));
    } catch (error) {
      console.error("Failed to load Bloom API:", error);
      res.statusCode = 500;
      res.setHeader("content-type", "application/json; charset=utf-8");
      res.end(JSON.stringify({
        ok: false,
        code: "APP_IMPORT_FAILED",
        error: error instanceof Error ? error.message : String(error),
      }));
    }
    return;
  }

  try {
    const app = await loadApp();
    app(req, res);
  } catch (error) {
    console.error("Failed to load Bloom API:", error);
    res.statusCode = 500;
    res.setHeader("content-type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ code: "APP_IMPORT_FAILED", error: "后端应用加载失败，请查看 Vercel Function 日志。" }));
  }
}
