# Deploy — Tarot Major Arcana

## Supabase

1. Install CLI: `npm i -g supabase`
2. Link project: `supabase link --project-ref YOUR_PROJECT_REF`
3. Push migrations: `supabase db push`
4. Set secrets:
   ```bash
   supabase secrets set GROQ_API_KEY=gsk_... GROQ_MODEL_FAST=llama-3.1-8b-instant GROQ_MODEL_DEEP=llama-3.3-70b-versatile
   ```
5. Travar CORS no dominio de producao:
   ```bash
   supabase secrets set ALLOWED_ORIGIN=https://seu-dominio.com
   ```
6. Deploy chat Edge Function:
   ```bash
   supabase functions deploy chat --no-verify-jwt
   ```
6. Optional Upstash rate limit:
   ```bash
   supabase secrets set UPSTASH_REDIS_REST_URL=... UPSTASH_REDIS_REST_TOKEN=...
   ```

## React SPA (Vercel / Cloudflare / static)

- Set `VITE_CHAT_API_URL` to `https://YOUR_PROJECT.supabase.co/functions/v1/chat`
- Update `vercel.json` or `public/_redirects` with your Supabase project URL
- Use `BrowserRouter` — hosting must serve `index.html` for all routes

## Angular (Analog)

- Set the same `VITE_CHAT_API_URL` in `tarot-angular/apps/web/.env`
- Or rely on Analog `/api/v1/chat` in dev; production should use the shared Edge Function

## OAuth redirects (Supabase Dashboard)

Add to Auth → URL configuration:

- `http://127.0.0.1:5173`
- `https://your-production-domain.com`

## Resend (auth emails)

Supabase Dashboard → Auth → SMTP → Resend credentials. See [Supabase Auth SMTP](https://supabase.com/docs/guides/auth/auth-smtp).
