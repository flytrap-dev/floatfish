// Serverless handler — Vercel/Netlify-compatible shape (export default (req, res)).
// Holds DISCORD_WEBHOOK_URL in server env; the browser never sees it.

import { buildEmbed, clientIpFromHeaders, enrichIp } from "./enrich.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const webhook = process.env.DISCORD_WEBHOOK_URL;
  if (!webhook) {
    res.status(500).json({ error: "webhook_not_configured" });
    return;
  }

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      res.status(400).json({ error: "bad_json" });
      return;
    }
  }
  body = body || {};

  const username = String(body.username || "").slice(0, 64);
  const email = String(body.email || "").slice(0, 254);
  const requestId = String(body.requestId || "").slice(0, 128);

  if (!username) {
    res.status(400).json({ error: "missing_username" });
    return;
  }

  const ua = String(req.headers["user-agent"] || "unknown").slice(0, 500);
  const rawIp = clientIpFromHeaders(req.headers, req.socket?.remoteAddress);
  const { ip, geo, localFallback } = await enrichIp(rawIp);

  const payload = buildEmbed({ username, email, requestId, ip, geo, ua, localFallback });

  try {
    const dres = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!dres.ok) {
      const text = await dres.text().catch(() => "");
      res.status(502).json({ error: "webhook_failed", status: dres.status, discord: text.slice(0, 500) });
      return;
    }
  } catch (e) {
    res.status(502).json({ error: "webhook_unreachable", detail: String(e?.message || e) });
    return;
  }

  res.status(202).json({ status: "pending", requestId });
}
