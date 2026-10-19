// POST /api/oauth/token
// Body: { grant_type:"authorization_code", code, client_id, client_secret, redirect_uri }
// Returns an access token (opaque, 30-day TTL) → use at /api/oauth/userinfo.

import crypto from "node:crypto";
import { store } from "../_store.js";

function hashSecret(s) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

async function parseBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  let raw = "";
  for await (const c of req) raw += c;
  const ct = (req.headers["content-type"] || "").toLowerCase();
  if (ct.includes("application/json")) {
    try { return JSON.parse(raw); } catch { return {}; }
  }
  // form-urlencoded
  const out = {};
  for (const pair of raw.split("&")) {
    const [k, v] = pair.split("=");
    if (k) out[decodeURIComponent(k)] = decodeURIComponent((v || "").replace(/\+/g, " "));
  }
  return out;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const body = await parseBody(req);
  const grantType = body.grant_type || "";
  const code = body.code || "";
  const clientId = body.client_id || "";
  const clientSecret = body.client_secret || "";
  const redirectUri = body.redirect_uri || "";

  if (grantType !== "authorization_code") {
    res.status(400).json({ error: "unsupported_grant_type" });
    return;
  }

  const client = await store.get(`key:${clientId}`);
  if (!client || client.secretHash !== hashSecret(clientSecret)) {
    res.status(401).json({ error: "invalid_client" });
    return;
  }

  const codeRec = await store.get(`oauth_code:${code}`);
  if (!codeRec || codeRec.clientId !== clientId || codeRec.redirectUri !== redirectUri) {
    res.status(400).json({ error: "invalid_grant" });
    return;
  }

  // One-time use.
  await store.del(`oauth_code:${code}`);

  const accessToken = "ff_tok_" + crypto.randomBytes(24).toString("base64url");
  const ttl = 30 * 24 * 60 * 60;
  await store.set(
    `oauth_tok:${accessToken}`,
    {
      clientId,
      userId: codeRec.userId,
      username: codeRec.username,
      scope: codeRec.scope,
      issuedAt: Date.now(),
    },
    { ttl }
  );

  // Also mark the client as "last_used" so the dashboard can show it.
  await store.set(`key:${clientId}`, { ...client, lastUsed: Date.now() });

  res.status(200).json({
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: ttl,
    scope: codeRec.scope,
  });
}
