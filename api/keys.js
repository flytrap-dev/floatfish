// GET  /api/keys           → list this user's API keys (masked)
// POST /api/keys           → { name, redirectUris? } → returns full secret ONCE
// DELETE /api/keys?id=xxx  → revoke a key

import crypto from "node:crypto";
import { store } from "./_store.js";
import { readSession } from "./_session.js";

function hashSecret(secret) {
  return crypto.createHash("sha256").update(secret).digest("hex");
}

function newId() {
  return "key_" + crypto.randomBytes(8).toString("hex");
}
function newSecret() {
  // ff_live_<base36 24 chars> — scannable prefix, easy to grep for leaks
  return "ff_live_" + crypto.randomBytes(18).toString("base64url");
}

function mask(secret) {
  if (!secret || secret.length < 12) return "ff_live_••••••••";
  return secret.slice(0, 11) + "•".repeat(20) + secret.slice(-4);
}

export default async function handler(req, res) {
  const sess = readSession(req);
  if (!sess) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  const uid = sess.sub;

  if (req.method === "GET") {
    const ids = await store.listSet(`user:${uid}:keys`);
    const keys = await Promise.all(
      ids.map(async (id) => {
        const k = await store.get(`key:${id}`);
        if (!k) return null;
        return {
          id,
          name: k.name,
          preview: k.preview,
          created: k.created,
          lastUsed: k.lastUsed || null,
          redirectUris: k.redirectUris || [],
        };
      })
    );
    res.status(200).json({ keys: keys.filter(Boolean) });
    return;
  }

  if (req.method === "POST") {
    let body = req.body;
    if (typeof body === "string") {
      try { body = JSON.parse(body); } catch { body = {}; }
    }
    body = body || {};
    const name = String(body.name || "Untitled key").slice(0, 60);
    const redirectUris = Array.isArray(body.redirectUris)
      ? body.redirectUris.slice(0, 10).map((u) => String(u).slice(0, 300))
      : [];

    const id = newId();
    const secret = newSecret();
    const record = {
      ownerId: uid,
      name,
      preview: mask(secret),
      secretHash: hashSecret(secret),
      redirectUris,
      created: Date.now(),
      lastUsed: null,
    };
    await store.set(`key:${id}`, record);
    await store.addToSet(`user:${uid}:keys`, id);

    res.status(201).json({
      id,
      name,
      secret, // shown ONCE — client must copy immediately
      preview: record.preview,
      redirectUris,
      created: record.created,
    });
    return;
  }

  if (req.method === "DELETE") {
    const id = (req.query && req.query.id) || "";
    if (!id) {
      res.status(400).json({ error: "missing_id" });
      return;
    }
    const k = await store.get(`key:${id}`);
    if (!k || k.ownerId !== uid) {
      res.status(404).json({ error: "not_found" });
      return;
    }
    await store.del(`key:${id}`);
    await store.removeFromSet(`user:${uid}:keys`, id);
    res.status(200).json({ ok: true });
    return;
  }

  res.status(405).json({ error: "method_not_allowed" });
}
