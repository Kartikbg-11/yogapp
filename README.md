# InnerPeace — Yoga • Meditation • Mantra Chanting

A premium, production-quality wellness sanctuary: guided yoga sessions, a meditation timer with live-synthesized ambient soundscapes, and a digital mala mantra counter — all backed by a real REST API, JWT-style auth, and per-user data ownership.

![stack](https://img.shields.io/badge/Next.js-16-black) ![ts](https://img.shields.io/badge/TypeScript-5-blue) ![prisma](https://img.shields.io/badge/Prisma-SQLite-green)

---

## ✨ Features

| Area | What's inside |
|---|---|
| **Home Dashboard** | Time-aware greeting, daily quote, animated goal rings, streak flame, recently completed sessions, smart suggestions from real goal data |
| **Mantra Chanting** | 108-bead mala ring, tap-to-count (+ keyboard `Space`), undo/reset, targets 27–1008, mala-round math, completion celebration, **idempotent autosave + session restore** |
| **Yoga** | 8 seeded routines (54 poses) with step-by-step instructions, safety notes, per-pose countdown player, pause/resume/prev/next, finish-early saving |
| **Meditation** | 1–30 min timer, inhale-hold-exhale breathing animation, 5 synthesized ambient soundscapes (rain/ocean/forest/wind/bells), volume + mute, interval bells, distraction-free mode |
| **Progress** | Recharts area/bar charts from real records, 12-week activity heatmap, streaks, personal records, milestone badges, session history, CSV exports + print |
| **Journal** | CRUD with search, category/date filters, pagination, mood tags, weekly reflection summary |
| **Auth & Settings** | Register/login/logout, light+dark themes, sound/haptics/quotes/reminder prefs, daily goals, preferred mantra, data export, account deletion |
| **Design** | Midnight-forest dark + warm cream light themes, glassmorphism, generated nature imagery, floating particles, Framer Motion micro-interactions, reduced-motion support, responsive sidebar → bottom-nav |

## 🔐 Demo account

```
email:    demo@innerpeace.app
password: innerpeace123
```

Comes with 14 days of seeded practice history so charts/streaks/journal are alive. Demo data lives under its own user — your real account is always separate.

## 🚀 Run it

```bash
# 1. install
bun install        # or npm install

# 2. environment (or: cp .env.example .env)
echo 'DATABASE_URL=file:../db/custom.db' > .env
echo 'AUTH_SECRET=change-me-in-production' >> .env

# 3. database schema
bun run db:push

# 4. seed mantras, routines, demo user
bun run prisma/seed.ts

# 5. dev server (port 3000)
bun run dev
```

Open the app via the Preview Panel (port 3000).

- **Full REST API reference:** [`docs/API.md`](docs/API.md) — every endpoint, DTO, and status code
- **Ready-made Postman collection:** [`public/postman/InnerPeace.postman_collection.json`](public/postman/InnerPeace.postman_collection.json) (import into Postman; Login auto-saves the token)
- **Design/API contract:** `agent-ctx/innerpeace-contract.md`

### Useful scripts

| Command | Purpose |
|---|---|
| `bun run dev` | dev server on :3000 |
| `bun run lint` | ESLint |
| `bun run db:push` | sync schema → SQLite |
| `bun run prisma/seed.ts` | (re)seed global data + demo user |

## 🗂 Architecture

```
src/
  app/
    page.tsx                 → renders <InnerPeaceApp/> (SPA; all views are client-side)
    api/                     → 17 REST route files (auth, mantras, chant-sessions,
                               yoga/*, meditation/*, goals, analytics, milestones,
                               journal/*, preferences, reports/csv)
  components/
    innerpeace/
      innerpeace-app.tsx     → auth gate + theme + view switch
      layout/                → sidebar, topbar, bottom-nav, sticky footer
      auth/ dashboard/ yoga/ meditation/ mantra/ progress/ journal/ settings/
      ui/                    → ProgressRing, ImageFallback, Particles, MilestoneIcon
  lib/
    auth.ts                  → scrypt password hashing + HMAC-signed tokens
    api-helpers.ts           → withAuth wrapper, IST date keys, streaks, milestone engine
    client.ts                → fetch wrapper (auto Bearer token), CSV downloader, formatters
    ambient.ts               → WebAudio synthesized soundscapes + bell/tick + haptics
    store.ts types.ts quotes.ts
prisma/
  schema.prisma              → 10 models, ownership FKs, indexes, cascade deletes
  seed.ts                    → 6 mantras, 8 routines, demo user history
public/images/               → 12 AI-generated nature/yoga photos
```

### Security & correctness

- Every private endpoint verifies `Authorization: Bearer <token>` → user-scoped queries only (401/404 on foreign resources)
- Passwords: `scrypt` with per-user salt; tokens: HMAC-SHA256, 30-day expiry; never log or return hashes
- Chant counter sends **absolute counts** (not increments) → duplicate/late PATCHes can't double-count; negative counts impossible
- All request bodies validated server-side with clamps + explicit status codes (400/401/404/409/500)

## 🧪 Verified end-to-end (browser-tested)

- register → login → dashboard loads real data (all 200s)
- mantra counter: tap ×3 → DB row `count=3` → navigate away/back → session restored → `Space` increments
- yoga player countdown → finish early → session saved with exact elapsed seconds
- journal search/filters, settings persistence, light/dark toggle, mobile bottom-nav layout
- duplicate PATCH idempotency test → count stays 5
- unauthorized request → 401
- CSV downloads with correct headers

## 📌 Limitations

- Ambient audio is synthesized in-browser (no external files — works offline by design)
- Daily reminder is a stored preference; no push service is wired
- SQLite file DB (swap `DATABASE_URL` + Prisma provider for Postgres in production)
