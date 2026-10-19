// Shared helpers used by both the Vite dev middleware and the serverless
// /api/login handler. Keeps the embed shape, geo lookup, UA parsing, and
// risk scoring in ONE place.

// ── icons / branding ────────────────────────────────────────────────────────
// Discord renders remote PNG/SVG in `author.icon_url` and `thumbnail.url`.
// Lucide + Simple Icons both serve raw SVGs over a stable CDN.
export const ICONS = {
  // Simple-Icons Discord logo (SVG → Discord rasterizes to the embed).
  discord: "https://cdn.simpleicons.org/discord/5865F2",
  // Lucide "shield-check" — our brand mark for the embed thumbnail.
  shield: "https://unpkg.com/lucide-static@latest/icons/shield-check.svg",
  // Lucide "triangle" (Vercel-style) as a fallback author icon.
  triangle: "https://unpkg.com/lucide-static@latest/icons/triangle.svg",
};

const PRIVATE_IP_RX =
  /^(10\.|127\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|::1$|::$|fc|fd|fe80:)/i;

export function isPrivateIp(ip) {
  if (!ip || ip === "unknown") return true;
  return PRIVATE_IP_RX.test(ip);
}

// ── client ip ───────────────────────────────────────────────────────────────
// In prod the host (Vercel/Netlify/Cloudflare) sets x-forwarded-for. In dev
// against localhost that header is absent and the socket IP is ::1, so we
// fall back to a public lookup so the embed shows something useful.
export function clientIpFromHeaders(headers, socketIp) {
  const fwd = headers["x-forwarded-for"];
  const first = (Array.isArray(fwd) ? fwd[0] : String(fwd || "")).split(",")[0].trim();
  return first || headers["cf-connecting-ip"] || headers["x-real-ip"] || socketIp || "";
}

async function fetchJsonSafe(url, { timeoutMs = 4000 } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { signal: ctrl.signal, headers: { "User-Agent": "floatfish-login" } });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

// 5-minute in-process cache so a reload doesn't hammer the lookup services.
const geoCache = new Map();
const GEO_TTL = 5 * 60 * 1000;

async function lookupPublicIp() {
  const j = await fetchJsonSafe("https://api.ipify.org?format=json", { timeoutMs: 3500 });
  return j?.ip || "";
}

export async function enrichIp(rawIp) {
  let ip = rawIp;
  let localFallback = false;

  if (isPrivateIp(ip)) {
    const pub = await lookupPublicIp();
    if (pub) {
      ip = pub;
      localFallback = true;
    } else {
      return { ip: rawIp || "unknown", geo: null, localFallback: true };
    }
  }

  const cached = geoCache.get(ip);
  if (cached && cached.exp > Date.now()) {
    return { ip, geo: cached.geo, localFallback };
  }

  // ipapi.co returns city, region, country_name, country_code, org, asn, timezone.
  // Free tier allows ~1k/day/IP, no key needed.
  const j = await fetchJsonSafe(`https://ipapi.co/${encodeURIComponent(ip)}/json/`, {
    timeoutMs: 4000,
  });

  const geo = j && !j.error
    ? {
        city: j.city || "",
        region: j.region || "",
        country: j.country_name || "",
        countryCode: (j.country_code || "").toLowerCase(),
        org: j.org || "",
        asn: j.asn || "",
        timezone: j.timezone || "",
      }
    : null;

  geoCache.set(ip, { geo, exp: Date.now() + GEO_TTL });
  return { ip, geo, localFallback };
}

// ── UA parsing (lightweight, no deps) ───────────────────────────────────────
export function parseUa(ua) {
  const s = String(ua || "");
  const browser =
    /Edg\/([\d.]+)/.exec(s)?.[0]?.replace("Edg/", "Edge ") ||
    /OPR\/([\d.]+)/.exec(s)?.[0]?.replace("OPR/", "Opera ") ||
    /Firefox\/([\d.]+)/.exec(s)?.[0] ||
    /Chrome\/([\d.]+)/.exec(s)?.[0] ||
    /Version\/([\d.]+).*Safari/.exec(s)?.[0]?.replace(/Version\/([\d.]+).*/, "Safari $1") ||
    "Unknown";
  const os =
    /Windows NT 10\.0/.test(s) ? "Windows 10/11" :
    /Windows NT 6\.3/.test(s) ? "Windows 8.1" :
    /Mac OS X ([\d_]+)/.test(s) ? "macOS " + (/Mac OS X ([\d_]+)/.exec(s)?.[1] || "").replace(/_/g, ".") :
    /Android ([\d.]+)/.test(s) ? "Android " + /Android ([\d.]+)/.exec(s)?.[1] :
    /iPhone OS ([\d_]+)/.test(s) ? "iOS " + (/iPhone OS ([\d_]+)/.exec(s)?.[1] || "").replace(/_/g, ".") :
    /Linux/.test(s) ? "Linux" :
    "Unknown";
  const device = /Mobi|Android|iPhone|iPad/i.test(s) ? "Mobile" : "Desktop";
  return { browser, os, device };
}

// ── risk scoring ────────────────────────────────────────────────────────────
const SUSPECT_ASN_RX = /(hosting|server|cloud|digital\s*ocean|ovh|hetzner|linode|vultr|amazon|google\s*cloud|azure|m247|datacenter|vpn|proxy|tor)/i;

export function riskAssess({ geo, ua, localFallback }) {
  const flags = [];
  if (localFallback) flags.push("Local request (dev)");
  if (!geo) flags.push("Geo lookup unavailable");
  if (geo?.org && SUSPECT_ASN_RX.test(geo.org)) flags.push("Hosting / VPN ASN");
  if (ua && /curl|wget|python|axios|node-fetch|postman|headless/i.test(ua)) flags.push("Non-browser user-agent");
  const level = flags.length === 0 ? "clean" : flags.length >= 2 ? "high" : "suspicious";
  return { level, flags };
}

// Brand accent (deep purple). Risk variants shift hue but stay in the purple family
// so the embed reads as "ours" first, risk-level second.
const RISK_META = {
  clean:      { color: 0x6d28d9, chip: "🟣 Clean",       title: "New login attempt" },
  suspicious: { color: 0xa855f7, chip: "🟠 Review",      title: "New login attempt · review" },
  high:       { color: 0x4c1d95, chip: "🔴 Suspicious",  title: "⚠ Suspicious login attempt" },
};

const flagEmoji = (cc) =>
  cc && cc.length === 2
    ? String.fromCodePoint(...[...cc.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65))
    : "🌐";

// ── field icons ─────────────────────────────────────────────────────────────
// Discord renders <:name:id> or <a:name:id> as a real image INLINE anywhere
// text is allowed (field names, descriptions, values). Upload PNGs once to
// your own server, then paste their IDs into env — e.g. DISCORD_EMOJI_IP=12345.
// Fallback is a clean unicode glyph so the embed is never ugly out of the box.
function emoji(envKey, fallback) {
  const id = process.env?.[envKey] || "";
  const name = envKey.replace(/^DISCORD_EMOJI_/, "").toLowerCase();
  return id ? `<:${name}:${id}>` : fallback;
}

function fieldIcons() {
  return {
    discord:   emoji("DISCORD_EMOJI_DISCORD",   "💬"),
    email:     emoji("DISCORD_EMOJI_EMAIL",     "✉️"),
    request:   emoji("DISCORD_EMOJI_REQUEST",   "🧾"),
    ip:        emoji("DISCORD_EMOJI_IP",        "📡"),
    location:  emoji("DISCORD_EMOJI_LOCATION",  "📍"),
    clock:     emoji("DISCORD_EMOJI_CLOCK",     "🕒"),
    network:   emoji("DISCORD_EMOJI_NETWORK",   "🌐"),
    browser:   emoji("DISCORD_EMOJI_BROWSER",   "🧭"),
    os:        emoji("DISCORD_EMOJI_OS",        "🖥️"),
    device:    emoji("DISCORD_EMOJI_DEVICE",    "📱"),
    risk:      emoji("DISCORD_EMOJI_RISK",      "🛡️"),
    agent:     emoji("DISCORD_EMOJI_AGENT",     "🔎"),
  };
}

// ── embed builder ───────────────────────────────────────────────────────────
export function buildEmbed({ username, email, requestId, ip, geo, ua, localFallback }) {
  const i = fieldIcons();
  const parsed = parseUa(ua);
  const risk = riskAssess({ geo, ua, localFallback });
  const meta = RISK_META[risk.level];

  const location = geo
    ? `${flagEmoji(geo.countryCode)}  \`${[geo.city, geo.region, geo.country].filter(Boolean).join(", ") || "Unknown"}\``
    : "`Unknown`";
  const network = geo?.org ? `\`${geo.org}${geo.asn ? " · " + geo.asn : ""}\`` : "`—`";
  const flags = risk.flags.length ? risk.flags.map((f) => `• ${f}`).join("\n") : "• None";

  return {
    username: "Login Request",
    avatar_url: ICONS.shield,
    embeds: [
      {
        author: { name: "Login Request · dashboard", icon_url: ICONS.triangle },
        title: meta.title,
        description: `**${meta.chip}**  ·  <t:${Math.floor(Date.now() / 1000)}:R>`,
        color: meta.color,
        thumbnail: { url: ICONS.discord },
        timestamp: new Date().toISOString(),
        fields: [
          { name: `${i.discord}  Discord`,    value: `\`@${username}\``, inline: true },
          { name: `${i.email}  Email`,        value: email ? `\`${email}\`` : "`—`", inline: true },
          { name: `${i.request}  Request ID`, value: `\`${requestId}\``, inline: false },
          { name: `${i.ip}  IP`,              value: `\`${ip}\`${localFallback ? "  _(public, dev proxy)_" : ""}`, inline: true },
          { name: `${i.location}  Location`,  value: location, inline: true },
          { name: `${i.clock}  Timezone`,     value: geo?.timezone ? `\`${geo.timezone}\`` : "`—`", inline: true },
          { name: `${i.network}  Network`,    value: network, inline: false },
          { name: `${i.browser}  Browser`,    value: `\`${parsed.browser}\``, inline: true },
          { name: `${i.os}  OS`,              value: `\`${parsed.os}\``, inline: true },
          { name: `${i.device}  Device`,      value: `\`${parsed.device}\``, inline: true },
          { name: `${i.risk}  Risk flags`,    value: flags, inline: false },
          { name: `${i.agent}  User agent`,   value: "```" + String(ua || "unknown").slice(0, 900) + "```", inline: false },
        ],
        footer: { text: "floatfish · login", icon_url: ICONS.shield },
      },
    ],
  };
}
