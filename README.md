# FloatFish

A 1:1 Google-login UI that gates sign-in on **Discord server membership**, backed by a webhook that posts enriched login telemetry (IP → geo, UA parsing, risk flags) into a Discord channel for review by a bot that approves/denies in-channel.

> This repo is the **frontend + serverless API** half. The Discord bot that approves logins is a separate service.

## Stack

- Vite + React + Tailwind (static build, deploys anywhere)
- Serverless `/api/login` handler (Vercel-shape, `(req, res)`)
- Vite dev middleware mirrors the serverless handler for local dev
- `api/enrich.js` — shared embed builder, IP geo lookup (ipapi.co, no key), UA parsing, risk scoring
- Discord webhook delivery held entirely on the server side

## Local dev

```bash
npm install
cp .env.example .env.local        # fill in DISCORD_WEBHOOK_URL
npm run dev
```

The webhook URL is read by the Vite dev middleware from `.env.local` and never shipped to the browser. See `ENV.md` for the full contract.

## Deploy (Vercel, free tier)

1. Import this repo in the Vercel dashboard.
2. Project settings → Environment variables → add `DISCORD_WEBHOOK_URL` (and any `DISCORD_EMOJI_*` IDs you want).
3. Deploy. `api/login.js` is auto-wired to `/api/login`.

## Security

- Discord webhook URL is **server-only** (no `VITE_` prefix). Anyone opening DevTools cannot see it.
- `.env`, `.env.local`, `.env.*.local` are gitignored. `.env.example` is the only env file committed.
- Login telemetry (IP, UA, geo) is posted only to your private Discord channel.

## Roadmap

- [ ] API-keys dashboard (Vercel KV, free tier)
- [ ] "Sign in with FloatFish" OAuth popup + SDK for third-party sites
- [ ] Session cookies after bot approves a login
