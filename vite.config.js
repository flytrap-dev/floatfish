import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// Dev-only API router. Loads each serverless handler and adapts Vite's Node
// req/res into the Vercel-shape (req.body/query, res.status().json()) so the
// same handlers work in `vite dev` and in prod on Vercel without duplication.
function devApi() {
  return {
    name: "dev-api",
    async configureServer(server) {
      async function load(path) {
        const m = await server.ssrLoadModule(path);
        return m.default;
      }

      // Wrap a Node (req, res) with Vercel-style helpers.
      function wrap(req, res, body, query) {
        req.body = body;
        req.query = query;
        res.status = (c) => {
          res.statusCode = c;
          return res;
        };
        res.json = (obj) => {
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(obj));
          return res;
        };
      }

      async function readBody(req) {
        return new Promise((resolve) => {
          let raw = "";
          req.on("data", (c) => (raw += c));
          req.on("end", () => {
            const ct = (req.headers["content-type"] || "").toLowerCase();
            if (!raw) return resolve({});
            if (ct.includes("application/json")) {
              try { return resolve(JSON.parse(raw)); } catch { return resolve({}); }
            }
            if (ct.includes("application/x-www-form-urlencoded")) {
              const out = {};
              for (const pair of raw.split("&")) {
                const [k, v] = pair.split("=");
                if (k) out[decodeURIComponent(k)] = decodeURIComponent((v || "").replace(/\+/g, " "));
              }
              return resolve(out);
            }
            resolve(raw);
          });
        });
      }

      // Route table — order matters (more specific first).
      const routes = [
        { match: /^\/api\/login\/approve$/,              module: "/api/login/approve.js" },
        { match: /^\/api\/login$/,                       module: "/api/login.js" },
        { match: /^\/api\/status\/([^/?]+)/,             module: "/api/status/[requestId].js", param: "requestId" },
        { match: /^\/api\/session$/,                     module: "/api/session.js" },
        { match: /^\/api\/keys$/,                        module: "/api/keys.js" },
        { match: /^\/api\/oauth\/authorize$/,            module: "/api/oauth/authorize.js" },
        { match: /^\/api\/oauth\/token$/,                module: "/api/oauth/token.js" },
        { match: /^\/api\/oauth\/userinfo$/,             module: "/api/oauth/userinfo.js" },
      ];

      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith("/api/")) return next();
        const url = new URL(req.url, "http://x");
        const path = url.pathname;

        const hit = routes.find((r) => r.match.test(path));
        if (!hit) return next();

        try {
          const body = ["POST", "PUT", "PATCH", "DELETE"].includes(req.method)
            ? await readBody(req)
            : undefined;
          const query = Object.fromEntries(url.searchParams);
          if (hit.param) {
            const m = path.match(hit.match);
            if (m && m[1]) query[hit.param] = decodeURIComponent(m[1]);
          }
          wrap(req, res, body, query);
          const handler = await load(hit.module);
          await handler(req, res);
        } catch (e) {
          console.error("[dev-api]", req.method, path, e);
          if (!res.writableEnded) {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "handler_crashed", detail: String(e?.message || e) }));
          }
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // loadEnv populates process.env for the API handlers (Vercel-style).
  const env = loadEnv(mode, process.cwd(), "");
  for (const [k, v] of Object.entries(env)) {
    if (!(k in process.env)) process.env[k] = v;
  }
  if (!process.env.DISCORD_WEBHOOK_URL) {
    console.warn("[dev] DISCORD_WEBHOOK_URL not set — /api/login will return webhook_not_configured.");
  }
  if (!process.env.BOT_SHARED_SECRET) {
    console.warn("[dev] BOT_SHARED_SECRET not set — /api/login/approve will return bot_secret_not_configured.");
  }

  return {
    plugins: [react(), devApi()],
    server: { port: 5173, host: true },
  };
});
