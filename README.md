# PostCraft — LinkedIn Post Generator (Next.js + Tailwind)

A minimal, production-ready app that generates LinkedIn posts via a hosted LLM (Mixtral on Fireworks).

## Quick start (local)

```bash
pnpm i # or npm i / yarn
cp .env.example .env.local
# paste your FIREWORKS_API_KEY into .env.local
pnpm dev
```

Open http://localhost:3000

## Deploy to Hostinger (Node.js app)

1. **Create a new Node.js app** in hPanel (or deploy via VPS):
   - Node version: 18 or 20
   - App start file (after build): use `npm start`

2. **Build & start commands**:
   - Build: `npm run build`
   - Start: `npm start`

3. **Environment variables** (hPanel → Advanced → Environment):
   - `FIREWORKS_API_KEY=...` (required)
   - Optional: `FIREWORKS_MODEL`, `FIREWORKS_BASE_URL`

4. **Upload the project**:
   - Zip this folder and upload, or push via Git. Run `npm i` in the app’s directory.

5. **Start the app**:
   - Run the build command, then start. The app exposes a standard Next.js server (`next start`).

## LLM notes

- Default model: Mixtral 8x7B Instruct on Fireworks (OpenAI-compatible).
- You can swap to other hosted models by changing `FIREWORKS_MODEL`, e.g.:
  - `accounts/fireworks/models/llama-v3p1-70b-instruct`
  - `accounts/fireworks/models/qwen2-72b-instruct`
- If you prefer Together.ai or OpenRouter, set their base URL & API key and model name accordingly, and reuse the same API route (the OpenAI SDK works with any OpenAI-compatible endpoint).

## Security

- The API key lives **server-side only** in env vars.
- The client calls `/api/generate-post`; the server talks to the LLM provider.
- Add rate limiting/caching later if you expect heavy traffic.

## Where’s the LinkedIn connect/post?

This starter focuses on post generation. To add posting later:
- Implement LinkedIn OAuth 2.0 on the server with scopes: `r_liteprofile`, `w_member_social`.
- Post via `ugcPosts` with the authorized member URN.
