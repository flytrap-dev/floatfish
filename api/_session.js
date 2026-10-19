// HMAC-signed session cookie: `<payload base64url>.<sig base64url>`.
// Payload = { sub, exp } JSON. Signed with SESSION_SECRET from env.
// Falls back to a per-process random secret in dev so cookies still work
// locally (invalidated on restart — intentional, don't deploy that way).

import crypto from "node:crypto";

const COOKIE_NAME = "fls";
const DEFAULT_TTL = 30 * 24 * 60 * 60; // 30 days

const SECRET =
  process.env.SESSION_SECRET ||
  (globalThis.__floatfishEphemeralSecret ||= crypto.randomBytes(32).toString("hex"));

function b64url(buf) {
  return Buffer.from(buf).toString("base64url");
}

export function signSession(payload, ttlSec = DEFAULT_TTL) {
  const body = { ...payload, exp: Math.floor(Date.now() / 1000) + ttlSec };
  const data = b64url(JSON.stringify(body));
  const sig = b64url(crypto.createHmac("sha256", SECRET).update(data).digest());
  return `${data}.${sig}`;
}

export function verifySession(token) {
  if (!token || typeof token !== "string") return null;
  const [data, sig] = token.split(".");
  if (!data || !sig) return null;
  const expected = b64url(crypto.createHmac("sha256", SECRET).update(data).digest());
  // constant-time compare
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const body = JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
    if (body.exp && body.exp * 1000 < Date.now()) return null;
    return body;
  } catch {
    return null;
  }
}

export function parseCookies(header) {
  const out = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i < 0) continue;
    out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

export function cookieHeader(value, { ttl = DEFAULT_TTL, clear = false } = {}) {
  const parts = [
    `${COOKIE_NAME}=${clear ? "" : value}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Secure",
  ];
  parts.push(`Max-Age=${clear ? 0 : ttl}`);
  return parts.join("; ");
}

export function readSession(req) {
  const cookies = parseCookies(req.headers.cookie || req.headers.Cookie);
  return verifySession(cookies[COOKIE_NAME]);
}

export const SESSION_COOKIE = COOKIE_NAME;
