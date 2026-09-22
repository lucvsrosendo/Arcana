# Tarot Angular (greenfield)

Parallel Angular monorepo for Tarot Major Arcana, sharing Supabase and chat API with the React SPA.

## Structure

- `packages/core` — `@tarot/core` domain logic (readings, history, XP, chat context, journal crypto)
- `apps/web` — Analog SPA (Zen Tailwind, TanStack Query, ngx-translate, AI chat)
- `apps/admin` — PrimeNG admin (news CRUD, comments, reports, engagement)

## Commands

```bash
cd tarot-angular
npm install
npm run dev          # web app @ http://localhost:5173
npm run dev:admin    # admin app
npm run test         # @tarot/core tests
npm run build:web
npm run build:admin
```

Copy `.env.example` to `apps/web/.env` and set Supabase + Groq keys for cloud features.
