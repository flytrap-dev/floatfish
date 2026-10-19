// GET /api/oauth/authorize?client_id=…&redirect_uri=…&state=…&scope=…
// If signed in → mint a short-lived auth code and redirect back to the client.
// If not signed in → send to /login?return=<encoded-authorize-url>.
//
// Minimal OAuth2 Authorization-Code (no PKCE yet). All codes 10-min TTL.

import crypto from "node:crypto";
import { store } from "../_store.js";
import { readSession } from "../_session.js";

function safeRedirect(url, params) {
  const u = new URL(url);
  for (const [k, v] of Object.entries(params)) {
    if (v != null) u.searchParams.set(k, String(v));
  }
  return u.toString();
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const url = new URL(req.url, `https://${req.headers.host}`);
  const clientId = url.searchParams.get("client_id") || "";
  const redirectUri = url.searchParams.get("redirect_uri") || "";
  const state = url.searchParams.get("state") || "";
  const scope = url.searchParams.get("scope") || "identify";
  const responseType = url.searchParams.get("response_type") || "code";

  if (!clientId || !redirectUri || responseType !== "code") {
    res.status(400).json({ error: "invalid_request" });
    return;
  }

  const client = await store.get(`key:${clientId}`);
  if (!client) {
    res.status(400).json({ error: "unknown_client" });
    return;
  }
  if (!client.redirectUris?.includes(redirectUri)) {
    res.status(400).json({ error: "redirect_uri_not_allowed" });
    return;
  }

  const sess = readSession(req);
  if (!sess) {
    const back = `/api/oauth/authorize${url.search}`;
    res.writeHead(302, { Location: `/?return=${encodeURIComponent(back)}` });
    res.end();
    return;
  }

  const code = crypto.randomBytes(24).toString("base64url");
  await store.set(
    `oauth_code:${code}`,
    {
      clientId,
      redirectUri,
      scope,
      userId: sess.sub,
      username: sess.name,
      createdAt: Date.now(),
    },
    { ttl: 10 * 60 }
  );

  res.writeHead(302, { Location: safeRedirect(redirectUri, { code, state }) });
  res.end();
}
