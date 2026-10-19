// Same-origin API. The webhook URL is held by the server-side handler
// (vite dev middleware in dev, serverless /api/login in prod), never shipped
// to the browser. Override with VITE_LOGIN_API_URL only if the backend lives
// on another origin.
const API_URL = (import.meta.env.VITE_LOGIN_API_URL || "").replace(/\/+$/, "");
const LOGIN_URL = API_URL ? `${API_URL}/login` : "/api/login";
const STATUS_BASE = API_URL ? `${API_URL}/status` : "/api/status";

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 120000;

function networkError() {
  const err = new Error("network");
  err.cause = "network";
  return err;
}

function newRequestId() {
  return (
    globalThis.crypto?.randomUUID?.() ||
    `req_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
  );
}

async function fetchJson(url, { method = "GET", body, timeoutMs = 15000 } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  let res;
  try {
    res = await fetch(url, {
      method,
      mode: "cors",
      cache: "no-store",
      credentials: "omit",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: ctrl.signal,
    });
  } catch {
    throw networkError();
  } finally {
    clearTimeout(timer);
  }
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { res, data };
}

function reasonForStatus(status, data) {
  if (data?.reason) return data.reason;
  if (data?.error) {
    // Surface the server error code so dev can see WHY instead of a generic message.
    const detail = data.status ? ` (discord ${data.status})` : "";
    return `Login verification failed: ${data.error}${detail}`;
  }
  if (status === 401 || status === 403) {
    return "You’re not approved to sign in with this Discord account.";
  }
  if (status === 404) {
    return "That Discord user isn’t in our server.";
  }
  if (status === 429) {
    return "Too many attempts. Wait a moment and try again.";
  }
  return `Login verification failed (HTTP ${status}). Try again.`;
}

function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(t);
        reject(new Error("aborted"));
      },
      { once: true }
    );
  });
}

async function pollStatus(requestId, { signal } = {}) {
  const deadline = Date.now() + POLL_TIMEOUT_MS;
  const url = `${STATUS_BASE}/${encodeURIComponent(requestId)}`;
  while (Date.now() < deadline) {
    if (signal?.aborted) throw new Error("aborted");
    const { res, data } = await fetchJson(url, { timeoutMs: 10000 });
    if (res.status === 200 && data) {
      const state = data.status || data.state;
      if (state === "approved" || data.allowed === true) {
        return { allowed: true, requestId };
      }
      if (state === "denied" || data.allowed === false) {
        return { allowed: false, reason: reasonForStatus(403, data) };
      }
      if (state === "expired") {
        return {
          allowed: false,
          reason: data?.reason || "Login request expired. Try again.",
        };
      }
    } else if (res.status === 404) {
      return { allowed: false, reason: "Login request not found. Try again." };
    } else if (res.status >= 400 && res.status !== 408 && res.status !== 202) {
      return { allowed: false, reason: reasonForStatus(res.status, data) };
    }
    try {
      await sleep(POLL_INTERVAL_MS, signal);
    } catch {
      throw new Error("aborted");
    }
  }
  return {
    allowed: false,
    reason: "Timed out waiting for approval. Ask in the server, then try again.",
  };
}

export async function requestAccess({ email, discord, signal } = {}) {
  const requestId = newRequestId();

  const { res, data } = await fetchJson(LOGIN_URL, {
    method: "POST",
    body: { username: discord, email, requestId },
    timeoutMs: 15000,
  });

  if (res.status === 200 || res.status === 201 || res.status === 202) {
    const effectiveId = data?.requestId || requestId;
    const state = data?.status || data?.state;
    if (state === "approved" || data?.allowed === true) {
      return { allowed: true, requestId: effectiveId };
    }
    if (state === "denied" || data?.allowed === false) {
      return { allowed: false, reason: reasonForStatus(403, data) };
    }
    // "pending" → bot is checking. Poll /api/status/<id> until it decides.
    // The server flips the record to approved/denied; approved sets the fls cookie.
    return pollStatus(effectiveId, { signal });
  }

  return { allowed: false, reason: reasonForStatus(res.status, data) };
}

// ── session + keys helpers (used by Dashboard) ──────────────────────────────

export async function getSession() {
  try {
    const r = await fetch("/api/session", { credentials: "same-origin" });
    const d = await r.json();
    return d?.user || null;
  } catch {
    return null;
  }
}

export async function signOut() {
  try {
    await fetch("/api/session", { method: "DELETE", credentials: "same-origin" });
  } catch {}
}

export async function listKeys() {
  const r = await fetch("/api/keys", { credentials: "same-origin" });
  if (!r.ok) throw new Error("list_failed");
  const d = await r.json();
  return d.keys || [];
}

export async function createKey({ name, redirectUris = [] }) {
  const r = await fetch("/api/keys", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, redirectUris }),
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d?.error || "create_failed");
  return d;
}

export async function getAnalytics() {
  const r = await fetch("/api/analytics", { credentials: "same-origin" });
  if (!r.ok) throw new Error("analytics_failed");
  return r.json();
}

export async function deleteKey(id) {
  const r = await fetch(`/api/keys?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
    credentials: "same-origin",
  });
  if (!r.ok) throw new Error("delete_failed");
  return r.json();
}

