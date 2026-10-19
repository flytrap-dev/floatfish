// GET /api/oauth/userinfo   Header: Authorization: Bearer <access_token>
// Returns { sub, username, verified: true } — third-party sites call this
// after exchanging the auth code at /token.

import { store } from "../_store.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : "";
  if (!token) {
    res.status(401).json({ error: "missing_token" });
    return;
  }
  const rec = await store.get(`oauth_tok:${token}`);
  if (!rec) {
    res.status(401).json({ error: "invalid_token" });
    return;
  }
  res.status(200).json({
    sub: rec.userId,
    username: rec.username,
    verified: true,
    scope: rec.scope,
  });
}
