// Bot callback. The Discord bot POSTs here once it decides a request.
// Body: { requestId, discordId, discordUsername, approved, reason? }
// Header: Authorization: Bearer <BOT_SHARED_SECRET>
// Writes `login:<requestId>` → { status, discordId, discordUsername, reason } with 5-min TTL.

import { store } from "../_store.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const expected = process.env.BOT_SHARED_SECRET;
  if (!expected) {
    res.status(500).json({ error: "bot_secret_not_configured" });
    return;
  }
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token || token !== expected) {
    res.status(401).json({ error: "unauthorized" });
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

  const requestId = String(body.requestId || "").slice(0, 128);
  const discordId = String(body.discordId || "").slice(0, 64);
  const discordUsername = String(body.discordUsername || "").slice(0, 64);
  const approved = body.approved === true;
  const reason = body.reason ? String(body.reason).slice(0, 300) : undefined;

  if (!requestId) {
    res.status(400).json({ error: "missing_requestId" });
    return;
  }

  await store.set(
    `login:${requestId}`,
    {
      status: approved ? "approved" : "denied",
      discordId,
      discordUsername,
      reason,
      decidedAt: Date.now(),
    },
    { ttl: 5 * 60 }
  );

  res.status(200).json({ ok: true });
}
