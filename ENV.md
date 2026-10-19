# Environment variables

The Discord webhook URL **never ships to the browser**. The client only ever
calls same-origin `/api/login`, which is handled server-side (dev: Vite
middleware in `vite.config.js`; prod: serverless function `api/login.js`).

## Local dev — `.env.local` (gitignored)

```
# Server-only — NO VITE_ prefix, so Vite will refuse to expose it to the client.
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/<id>/<token>
```

Then `npm run dev` and the webhook posts come from the Node process, not the browser.

## Production — set in your host's env dashboard

| Var | Scope | What |
| --- | --- | --- |
| `DISCORD_WEBHOOK_URL` | **server only** | Discord webhook. Required. |
| `VITE_LOGIN_API_URL` | client (optional) | Only if your bot backend lives on a different origin and exposes `/login` + `/status/{id}`. Leave blank to use the bundled `/api/login` serverless function. |

### Deploy targets

- **Vercel** — drop as-is. `api/login.js` is picked up automatically and routed to `/api/login`.
- **Netlify** — add to `netlify.toml`:
  ```toml
  [build] command = "npm run build"  publish = "dist"
  [functions] directory = "api"
  [[redirects]] from = "/api/*"  to = "/.netlify/functions/:splat"  status = 200
  ```
- **Anything else** — port `api/login.js` to your runtime; it's a plain `(req, res)` handler.

## Backend contract

The frontend speaks two endpoints under `VITE_LOGIN_API_URL`:

### 1. `POST /login`

Request body (JSON):

```json
{
  "username": "someuser",      // Discord username, lowercase, no leading @
  "email":    "foo@gmail.com", // the Google email they entered
  "requestId":"<uuid>"         // client-generated correlation id
}
```

Response — any of:

- `200/201/202 { "status": "pending", "requestId": "<uuid>" }`
  → the client will begin polling `GET /status/<requestId>` until the bot decides.
  (`requestId` in the response overrides the client's id if present.)
- `200 { "status": "approved" }` or `{ "allowed": true }` → signed in immediately.
- `200 { "status": "denied", "reason": "…" }` or `{ "allowed": false }` → inline error.
- `401 / 403` → "You’re not approved to sign in with this Discord account."
- `404` → "That Discord user isn’t in our server."
- `429` → "Too many attempts. Wait a moment and try again."

### 2. `GET /status/{requestId}`

Response — any of:

- `200 { "status": "pending" }` → keep polling (client polls every 2s, 2 min cap).
- `200 { "status": "approved" }` or `{ "allowed": true }` → signed in.
- `200 { "status": "denied",  "reason": "…" }` → inline error.
- `200 { "status": "expired", "reason": "…" }` → "Login request expired. Try again."
- `404` → "Login request not found. Try again."
- `4xx/5xx { "reason": "…" }` → shown as inline error.

## Flow

1. User submits their Discord username on step 2.
2. Client `POST /login` with `{ username, email, requestId }`.
3. **Your backend** posts the Discord webhook embed (never the client — keeps the
   webhook URL off the public internet) and marks the request `pending`.
4. Your Discord bot watches your guild for the username, checks for the
   customer role, then flips the request to `approved` or `denied`.
5. Client polls `GET /status/<requestId>` every 2s until it sees a terminal
   state, then signs the user in or shows the reason.

The browser never sees the webhook URL and never calls Discord directly.
