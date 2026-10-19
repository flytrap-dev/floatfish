// Pixel Rogue — demo third-party site that signs users in via FloatFish.
// Configure these two values from your FloatFish dashboard → New client.
const CONFIG = {
  // Load from localStorage so you can edit via the browser console without
  // touching the file. Set with:  localStorage.setItem('ff_client_id', 'key_…')
  CLIENT_ID: localStorage.getItem("ff_client_id") || "YOUR_CLIENT_ID",
  // Must EXACTLY match a Redirect URI you registered on the client.
  REDIRECT_URI: location.origin + "/demo/callback.html",
  SCOPE: "identify",
  // The FloatFish origin. Defaults to the current one (same-origin demo).
  FLOATFISH_ORIGIN: location.origin,
};

// Load the SDK dynamically so this file is self-contained.
function loadSdk() {
  return new Promise((resolve, reject) => {
    if (window.FloatFish) return resolve(window.FloatFish);
    const s = document.createElement("script");
    s.src = CONFIG.FLOATFISH_ORIGIN + "/sdk.js";
    s.onload = () => resolve(window.FloatFish);
    s.onerror = () => reject(new Error("sdk_load_failed"));
    document.head.appendChild(s);
  });
}

const el = (id) => document.getElementById(id);
const setStatus = (msg, cls = "") => {
  const s = el("status");
  s.textContent = msg;
  s.className = "status " + cls;
};

el("origin").textContent = CONFIG.FLOATFISH_ORIGIN;

// Shows the signed-in view with the user's profile.
function renderUser(userinfo, accessToken) {
  el("pre-signin").style.display = "none";
  el("post-signin").style.display = "";
  el("user-name").textContent = "@" + (userinfo.username || "unknown");
  el("user-sub").textContent = userinfo.sub || "";
  el("avatar").textContent = (userinfo.username?.[0] || "?").toUpperCase();
  el("scope").textContent = userinfo.scope || "identify";
  el("tok").textContent = accessToken.slice(0, 10) + "…";
  el("userinfo").textContent = JSON.stringify(userinfo, null, 2);
  localStorage.setItem("ff_token", accessToken);
}

// If we already have a token from last session, use it directly.
async function tryExistingSession() {
  const tok = localStorage.getItem("ff_token");
  if (!tok) return false;
  try {
    const r = await fetch(CONFIG.FLOATFISH_ORIGIN + "/api/oauth/userinfo", {
      headers: { Authorization: "Bearer " + tok },
    });
    if (!r.ok) throw new Error("expired");
    const d = await r.json();
    renderUser(d, tok);
    return true;
  } catch {
    localStorage.removeItem("ff_token");
    return false;
  }
}

// Exchange auth code for an access token. In production this HAS to run on
// your backend because it uses the client_secret. For the demo we do it
// client-side — same risk model, since this is a toy.
async function exchangeCode(code) {
  const CLIENT_SECRET = localStorage.getItem("ff_client_secret") || "YOUR_CLIENT_SECRET";
  const r = await fetch(CONFIG.FLOATFISH_ORIGIN + "/api/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code,
      client_id: CONFIG.CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: CONFIG.REDIRECT_URI,
    }),
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || "token_exchange_failed");
  return d.access_token;
}

async function fetchUserinfo(token) {
  const r = await fetch(CONFIG.FLOATFISH_ORIGIN + "/api/oauth/userinfo", {
    headers: { Authorization: "Bearer " + token },
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || "userinfo_failed");
  return d;
}

el("signin-btn").addEventListener("click", async () => {
  if (CONFIG.CLIENT_ID === "YOUR_CLIENT_ID") {
    setStatus(
      "Set a client ID first: localStorage.setItem('ff_client_id', 'key_…'); localStorage.setItem('ff_client_secret', 'ff_live_…')",
      "err"
    );
    return;
  }
  setStatus("Opening FloatFish popup…");
  try {
    const sdk = await loadSdk();
    sdk.signIn({
      clientId: CONFIG.CLIENT_ID,
      redirectUri: CONFIG.REDIRECT_URI,
      scope: CONFIG.SCOPE,
      onSuccess: async ({ code }) => {
        setStatus("Exchanging code for token…");
        try {
          const token = await exchangeCode(code);
          const userinfo = await fetchUserinfo(token);
          renderUser(userinfo, token);
          setStatus("Signed in.", "ok");
        } catch (e) {
          setStatus("Token exchange failed: " + e.message, "err");
        }
      },
      onError: (err) => {
        setStatus("Sign-in failed: " + err.message, "err");
      },
    });
  } catch (e) {
    setStatus("Could not load SDK: " + e.message, "err");
  }
});

el("signout-btn").addEventListener("click", () => {
  localStorage.removeItem("ff_token");
  el("pre-signin").style.display = "";
  el("post-signin").style.display = "none";
  setStatus("Signed out.");
});

tryExistingSession();
