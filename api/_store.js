// Tiny KV wrapper. Uses Vercel KV when env is set; otherwise falls back to an
// in-process Map so `vite dev` and `vercel dev` both work without any setup.
// The fallback is NOT persistent — it loses data on process restart. Fine for
// local prototyping; real deployment must have KV configured.

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

const memory = globalThis.__floatfishMemStore || (globalThis.__floatfishMemStore = new Map());
const memoryExpiry = globalThis.__floatfishMemExp || (globalThis.__floatfishMemExp = new Map());

function memGet(key) {
  const exp = memoryExpiry.get(key);
  if (exp && exp < Date.now()) {
    memory.delete(key);
    memoryExpiry.delete(key);
    return null;
  }
  const v = memory.get(key);
  return v === undefined ? null : v;
}
function memSet(key, value, ttlSec) {
  memory.set(key, value);
  if (ttlSec) memoryExpiry.set(key, Date.now() + ttlSec * 1000);
  else memoryExpiry.delete(key);
}
function memDel(key) {
  memory.delete(key);
  memoryExpiry.delete(key);
}

async function kvFetch(path, body) {
  const r = await fetch(`${KV_URL}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${KV_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`kv ${path} ${r.status}`);
  return r.json();
}

export const store = {
  backend: KV_URL && KV_TOKEN ? "kv" : "memory",

  async get(key) {
    if (this.backend === "memory") return memGet(key);
    const r = await kvFetch("/", ["GET", key]);
    const raw = r.result;
    if (raw == null) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  },

  async set(key, value, { ttl } = {}) {
    const payload = typeof value === "string" ? value : JSON.stringify(value);
    if (this.backend === "memory") {
      memSet(key, typeof value === "string" ? value : JSON.parse(payload), ttl);
      return;
    }
    const args = ["SET", key, payload];
    if (ttl) args.push("EX", String(ttl));
    await kvFetch("/", args);
  },

  async del(key) {
    if (this.backend === "memory") return memDel(key);
    await kvFetch("/", ["DEL", key]);
  },

  // Simple "list under prefix" by maintaining a sibling SET.
  // Keeps the KV wrapper free of SCAN complexity.
  async addToSet(setKey, member) {
    if (this.backend === "memory") {
      const s = memGet(setKey) || [];
      if (!s.includes(member)) s.push(member);
      memSet(setKey, s);
      return;
    }
    await kvFetch("/", ["SADD", setKey, member]);
  },
  async removeFromSet(setKey, member) {
    if (this.backend === "memory") {
      const s = memGet(setKey) || [];
      memSet(setKey, s.filter((x) => x !== member));
      return;
    }
    await kvFetch("/", ["SREM", setKey, member]);
  },
  async listSet(setKey) {
    if (this.backend === "memory") return memGet(setKey) || [];
    const r = await kvFetch("/", ["SMEMBERS", setKey]);
    return r.result || [];
  },
};
