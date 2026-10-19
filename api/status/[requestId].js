// Client polls GET /api/status/<requestId> after submitting login.
// Returns {status: "pending"|"approved"|"denied"|"expired", reason?}
// On "approved" also sets the fls session cookie — client flips to dashboard.

import { store } from "../_store.js";
import { signSession, cookieHeader } from "../_session.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const requestId =
    (req.query && req.query.requestId) ||
    req.url.split("?")[0].split("/").pop() ||
    "";
  if (!requestId) {
    res.status(400).json({ error: "missing_requestId" });
    return;
  }

  const rec = await store.get(`login:${requestId}`);
  if (!rec) {
    // Not yet set by the bot. Could be pending or expired — client treats
    // this as "keep polling until own timeout".
    res.status(200).json({ status: "pending" });
    return;
  }

  if (rec.status === "approved") {
    const token = signSession({ sub: rec.discordId, name: rec.discordUsername });
    res.setHeader("Set-Cookie", cookieHeader(token));
    res.status(200).json({
      status: "approved",
      discord: { id: rec.discordId, username: rec.discordUsername },
    });
    return;
  }

  res.status(200).json({ status: rec.status, reason: rec.reason });
}
