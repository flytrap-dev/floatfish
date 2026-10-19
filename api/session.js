// GET /api/session   → { user: { id, username } | null }
// DELETE /api/session → clears cookie (sign out)

import { readSession, cookieHeader } from "./_session.js";

export default async function handler(req, res) {
  if (req.method === "DELETE") {
    res.setHeader("Set-Cookie", cookieHeader("", { clear: true }));
    res.status(200).json({ ok: true });
    return;
  }
  if (req.method !== "GET") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }
  const sess = readSession(req);
  if (!sess) {
    res.status(200).json({ user: null });
    return;
  }
  res.status(200).json({ user: { id: sess.sub, username: sess.name } });
}
