# InnerPeace — REST API Documentation

**Base URL:** `http://<host>/api` (same origin as the app — all paths below are relative to `/api`)
**Content-Type:** `application/json` (except CSV report endpoint)
**Version:** 1.0 · Next.js 16 App Router Route Handlers · Prisma + SQLite

---

## 1. Authentication

InnerPeace uses a **self-contained signed token** (HMAC-SHA256). No cookies — the client stores the token and sends it on every request.

### Obtaining a token

```
POST /api/auth/register    → 201 { token, user }
POST /api/auth/login       → 200 { token, user }
```

### Sending the token

Every protected endpoint requires the header:

```
Authorization: Bearer <token>
```

**Token payload** (opaque to clients): `{ uid: <userId>, iat: <ms>, exp: <ms> }` — valid for **30 days**. Expired or invalid tokens return `401`, and the frontend automatically clears the stored session.

**Demo account** (pre-seeded with 14 days of history):

```
POST /api/auth/login
{ "email": "demo@innerpeace.app", "password": "innerpeace123" }
```

---

## 2. Conventions

### Error format

All errors return a JSON body with an `error` message:

| Status | Meaning |
|---|---|
| `400` | Invalid input (validation, bad JSON body, unknown report type) |
| `401` | Missing/invalid/expired token |
| `404` | Resource not found **or not owned by caller** (ownership is never leaked) |
| `409` | Duplicate (e.g., email already registered) |
| `500` | Internal server error |

```json
{ "error": "Please enter a valid email address" }
```

### Common rules

- **Privacy:** every resource query is scoped by the authenticated `userId`. Cross-user access returns `404`, never `403`.
- **Pagination:** `?limit=` style params are clamped server-side (`clampInt`) — out-of-range values fall back to defaults, never error.
- **Dates:** all date keys are `YYYY-MM-DD` strings computed in **IST (+05:30)**.
- **Counters are absolute, not incremental:** PATCH endpoints set values; clients resend current totals (makes retries/offline recovery idempotent).

---

## 3. Endpoints

### 3.1 Auth

#### `POST /api/auth/register`

Create an account. A default `Preference` row is created automatically.

**Body**

| Field | Type | Rules |
|---|---|---|
| `name` | string | min 2 chars |
| `email` | string | valid email, stored lowercase |
| `password` | string | min 6 chars (stored as scrypt hash) |

**Response `201`**

```json
{
  "token": "eyJ1aWQiOiJjbXZr…",
  "user": {
    "id": "cmvkjb513000eu26ds42d7tj7",
    "email": "you@example.com",
    "name": "You",
    "avatarSeed": "lotus",
    "timezone": "Asia/Calcutta",
    "createdAt": "2026-10-23T05:33:38.487Z"
  }
}
```

Errors: `400` validation · `409` email exists.

#### `POST /api/auth/login`

**Body:** `{ "email": string, "password": string }`
**Response `200`:** `{ "token", "user" }` — same shape as register.
Errors: `401` invalid credentials.

#### `GET /api/auth/me` 🔒

Validate a stored token / fetch current profile.
**Response `200`:** `{ "user": UserDTO }`

---

### 3.2 Mantras

#### `GET /api/mantras` 🔒

**Response `200`:** `{ "mantras": MantraDTO[] }`
Returns the 6 seeded global mantras **plus** the user's custom ones (customs flagged `"isCustom": true`).

```json
{
  "mantras": [
    { "id": "…", "name": "Om", "text": "ॐ", "meaning": "The primordial sound", "isCustom": false },
    { "id": "…", "name": "My mantra", "text": "So Hum", "meaning": "I am that", "isCustom": true }
  ]
}
```

#### `POST /api/mantras` 🔒

**Body:** `{ "name": string, "text": string, "meaning"?: string }`
**Response `201`:** `{ "mantra": MantraDTO }` (with `isCustom: true`)

#### `DELETE /api/mantras/:id` 🔒

Deletes a **custom mantra owned by the caller**. Global mantras and other users' mantras → `404`.
**Response `200`:** `{ "ok": true }`

---

### 3.3 Chant sessions (mantra counter)

#### `GET /api/chant-sessions` 🔒

**Query**

| Param | Type | Default | Notes |
|---|---|---|---|
| `limit` | int 1–100 | `20` | most recent sessions |
| `active` | `1` | — | switches to "resume" mode |

**Response (list) `200`:** `{ "sessions": ChantSessionDTO[] }`

**Response (`active=1`) `200`:** `{ "active": ChantSessionDTO | null }` — latest **unfinished** session updated within the last 24 h, used to restore an interrupted counting session.

#### `POST /api/chant-sessions` 🔒

Create a session, or **upsert by client-generated `id`** (idempotent — safe against double-taps and offline replays).

**Body**

| Field | Type | Rules |
|---|---|---|
| `id` | string | optional, min 8 chars → enables upsert |
| `mantraId` | string | optional |
| `mantraName` | string | defaults to `"Om"` |
| `target` | int 27–1008 | default `108` (allowed: 27/54/108/216/1008) |
| `count` | int 0–1008 | optional, default `0` |

**Response:** `201` (created) / `200` (upserted)

```json
{ "session": { "…ChantSessionDTO": "" }, "milestones": [] }
```

`milestones` is populated when the session was completed and new badges were earned.

#### `PATCH /api/chant-sessions/:id` 🔒

Update counters. **Values are absolute** (not deltas) — the client sends the full current count, making duplicate requests harmless. `count` is clamped ≥ 0.

**Body (all optional):** `{ "count": int, "durationSec": int, "completed": boolean }`
**Response `200`:** `{ "session": ChantSessionDTO, "milestones": MilestoneDTO[] }`
Errors: `404` if not owner.

---

### 3.4 Yoga

#### `GET /api/yoga/routines` 🔒

**Response `200`:** `{ "routines": YogaRoutineDTO[] }` — 8 seeded routines (beginner-flow, desk-reset, sun-salutation, warrior-strength, deep-flexibility, advanced-inversion, evening-wind-down, pranayama). `benefits`, `safety`, `poses` are parsed arrays.

#### `GET /api/yoga/sessions?limit=20` 🔒

**Response `200`:** `{ "sessions": YogaSessionDTO[] }` (newest first, limit 1–100)

#### `POST /api/yoga/sessions` 🔒

**Body:** `{ "routineId"?: string, "routineTitle": string, "durationSec": int, "completed": boolean }`
**Response `201`:** `{ "session": YogaSessionDTO, "milestones": MilestoneDTO[] }`

---

### 3.5 Meditation

#### `GET /api/meditation/sessions?limit=20` 🔒

**Response `200`:** `{ "sessions": MeditationSessionDTO[] }`

#### `POST /api/meditation/sessions` 🔒

**Body:** `{ "plannedSec": int, "durationSec": int, "ambient"?: "rain"|"ocean"|"forest"|"wind"|"bells", "completed": boolean }`
**Response `201`:** `{ "session": MeditationSessionDTO, "milestones": MilestoneDTO[] }`

---

### 3.6 Daily goals

#### `GET /api/goals?date=YYYY-MM-DD` 🔒

Defaults to today (IST). Targets fall back to the user's preference defaults when no row exists for that date.

**Response `200`:**

```json
{
  "goal": {
    "date": "2026-10-23",
    "yogaTarget": 1,
    "meditationTarget": 10,
    "chantTarget": 108,
    "yogaDone": 1,
    "meditationDone": 15,
    "chantDone": 216
  }
}
```

Derived fields: `yogaDone` = completed yoga sessions that date · `meditationDone` = completed meditation **minutes** that date · `chantDone` = total chant count that date.

#### `PATCH /api/goals` 🔒

**Body:** `{ "date": "YYYY-MM-DD", "yogaTarget"?: int, "meditationTarget"?: int, "chantTarget"?: int }`
**Response `200`:** `{ "goal": GoalDTO }` (upserts the row for that date)

---

### 3.7 Analytics

#### `GET /api/analytics/summary?days=30` 🔒

Single aggregated payload powering the Progress view. `days` clamped 1–365.

**Response `200`:**

```json
{
  "summary": {
    "totals": {
      "chants": 1512,
      "malaRounds": 14,
      "yogaSessions": 22,
      "yogaMinutes": 480,
      "meditationSessions": 30,
      "meditationMinutes": 390
    },
    "streak": { "current": 6, "longest": 9 },
    "byDay": [
      { "date": "2026-09-24", "yogaMin": 0, "meditationMin": 10, "chants": 0, "yogaSessions": 0, "meditationSessions": 1 }
    ],
    "milestones": [
      { "key": "chants_1080", "title": "Thousand Voices", "description": "1,080 total chants", "icon": "om", "achievedAt": "…" }
    ],
    "records": {
      "longestChantSession": 216,
      "longestMeditation": 1800,
      "mostChantsInADay": 324,
      "totalActiveDays": 14
    }
  }
}
```

- `byDay` is **zero-filled** — exactly one entry per day for the last `days` days (inclusive of today), oldest first. Feed it straight into Recharts.
- `malaRounds` = floor(totalChants / 108).
- Streaks are computed server-side over IST day keys (a day counts as active if any chant > 0, completed yoga, or completed meditation happened).

#### `GET /api/milestones` 🔒

**Response `200`:** `{ "milestones": MilestoneDTO[] }` (newest first). 10 defined badges: `first_session`, `chants_108`, `chants_1080`, `mala_10`, `streak_7`, `streak_30`, `meditation_60`, `meditation_300`, `yoga_10`, `journal_5`.

---

### 3.8 Journal

#### `GET /api/journal` 🔒

Search / filter / paginate.

**Query**

| Param | Type | Default | Notes |
|---|---|---|---|
| `search` | string | — | matches on title + content |
| `category` | enum | — | one of `gratitude` `reflection` `goals` `meditation` |
| `from` / `to` | `YYYY-MM-DD` | — | entryDate range (either or both) |
| `page` | int ≥ 1 | `1` | |
| `pageSize` | int 1–50 | `20` | |

**Response `200`:** `{ "entries": JournalEntryDTO[], "total": number, "page": number, "pageSize": number }`

#### `POST /api/journal` 🔒

**Body:** `{ "title": string (required), "content": string (required), "category"?: enum, "mood"?: string, "entryDate"?: "YYYY-MM-DD" }`
Invalid/missing `category` → `"reflection"`. Missing `entryDate` → today (IST).
**Response `201`:** `{ "entry": JournalEntryDTO }`

#### `GET /api/journal/:id` 🔒

**Response `200`:** `{ "entry": JournalEntryDTO }` · Errors: `404` if not owner.

#### `PATCH /api/journal/:id` 🔒

**Body (all optional):** `{ "title"?, "content"?, "category"?, "mood"?, "entryDate"? }`
**Response `200`:** `{ "entry": JournalEntryDTO }`

#### `DELETE /api/journal/:id` 🔒

**Response `200`:** `{ "ok": true }`

---

### 3.9 Preferences

#### `GET /api/preferences` 🔒

**Response `200`:**

```json
{
  "preferences": {
    "theme": "dark",
    "soundEnabled": true,
    "hapticsEnabled": true,
    "dailyReminder": false,
    "reminderTime": "06:00",
    "motivationalQuotes": true,
    "preferredMantraId": null,
    "defaultChantTarget": 108,
    "dailyYogaGoal": 1,
    "dailyMeditationGoal": 10,
    "dailyChantGoal": 108
  }
}
```

#### `PATCH /api/preferences` 🔒

Send any subset of the fields above. A row is created with defaults if none exists.
**Response `200`:** `{ "preferences": PreferenceDTO }`

---

### 3.10 Reports (CSV export)

#### `GET /api/reports/csv?type=yoga|meditation|chant|journal` 🔒

**Response `200`:** `text/csv; charset=utf-8` with
`Content-Disposition: attachment; filename="innerpeace-<type>-<YYYY-MM-DD>.csv"`

| `type` | Columns | Scope |
|---|---|---|
| `yoga` | Date, Routine, Duration (min), Completed | last 365 days |
| `meditation` | Date, Planned (min), Duration (min), Ambient, Completed | last 365 days |
| `chant` | Date, Mantra, Count, Target, Mala Rounds, Duration (min), Completed | last 365 days |
| `journal` | Date, Title, Category, Mood, Content | all entries |

Errors: `400` unknown type. Fields containing commas/quotes/newlines are RFC-4180 escaped.

Frontend shortcut: `downloadCsv('yoga')` from `@/lib/client` (attaches the token and triggers the browser download).

---

### 3.11 Health

#### `GET /api`

Unauthenticated smoke test.
**Response `200`:** `{ "message": "Hello, world!" }`

---

## 4. Data Models

```ts
interface UserDTO {
  id: string; email: string; name: string
  avatarSeed: string; timezone: string; createdAt: string  // ISO datetime
}

interface PreferenceDTO {
  theme: string; soundEnabled: boolean; hapticsEnabled: boolean
  dailyReminder: boolean; reminderTime: string; motivationalQuotes: boolean
  preferredMantraId: string | null; defaultChantTarget: number
  dailyYogaGoal: number; dailyMeditationGoal: number; dailyChantGoal: number
}

interface MantraDTO {
  id: string; name: string; text: string
  meaning: string | null; isCustom: boolean
}

interface ChantSessionDTO {
  id: string; mantraId: string | null; mantraName: string
  count: number; target: number; durationSec: number
  completed: boolean; createdAt: string; updatedAt: string
}

interface YogaPose {
  name: string; sanskritName?: string; durationSec: number
  instructions: string; safety?: string
}

interface YogaRoutineDTO {
  id: string; title: string; slug: string; category: string
  level: string; durationMin: number; imageKey: string; description: string
  benefits: string[]; safety: string[]; poses: YogaPose[]
}

interface YogaSessionDTO {
  id: string; routineId: string | null; routineTitle: string
  durationSec: number; completed: boolean; createdAt: string
}

interface MeditationSessionDTO {
  id: string; plannedSec: number; durationSec: number
  ambient: string | null; completed: boolean; createdAt: string
}

interface GoalDTO {
  date: string  // YYYY-MM-DD (IST)
  yogaTarget: number; meditationTarget: number; chantTarget: number
  yogaDone: number; meditationDone: number; chantDone: number
}

interface MilestoneDTO {
  key: string; title: string; description: string
  icon: string; achievedAt: string
}

interface DayActivity {
  date: string  // YYYY-MM-DD (IST)
  yogaMin: number; meditationMin: number; chants: number
  yogaSessions: number; meditationSessions: number
}

interface JournalEntryDTO {
  id: string; title: string; content: string; category: string
  mood: string | null; entryDate: string  // YYYY-MM-DD
  createdAt: string; updatedAt: string
}
```

🔒 = requires `Authorization: Bearer <token>`

---

## 5. Quick Start (curl)

```bash
BASE=http://localhost:3000/api

# 1) Login (or register)
TOKEN=$(curl -s -X POST $BASE/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"demo@innerpeace.app","password":"innerpeace123"}' \
  | node -pe 'JSON.parse(require("fs").readFileSync(0)).token')

AUTH="Authorization: Bearer $TOKEN"

# 2) Fetch mantras & routines
curl -s $BASE/mantras -H "$AUTH"
curl -s $BASE/yoga/routines -H "$AUTH"

# 3) Count 3 chants (create session, then absolute PATCH)
SID=$(curl -s -X POST $BASE/chant-sessions -H "$AUTH" -H 'Content-Type: application/json' \
  -d '{"id":"demo-session-0001","mantraName":"Om","target":108}' \
  | node -pe 'JSON.parse(require("fs").readFileSync(0)).session.id')

curl -s -X PATCH $BASE/chant-sessions/$SID -H "$AUTH" -H 'Content-Type: application/json' \
  -d '{"count":3,"durationSec":45}'

# 4) Complete it and check analytics
curl -s -X PATCH $BASE/chant-sessions/$SID -H "$AUTH" -H 'Content-Type: application/json' \
  -d '{"count":108,"completed":true}'

curl -s "$BASE/analytics/summary?days=7" -H "$AUTH"

# 5) Journal: create, list, export
curl -s -X POST $BASE/journal -H "$AUTH" -H 'Content-Type: application/json' \
  -d '{"title":"Calm morning","content":"Breathwork before sunrise.","category":"gratitude","mood":"peaceful"}'

curl -s "$BASE/journal?search=calm&page=1&pageSize=10" -H "$AUTH"
curl -s -o progress.csv "$BASE/reports/csv?type=chant" -H "$AUTH"
```

---

## 6. Implementation Notes

- **Stack:** Next.js 16 Route Handlers (`src/app/api/**/route.ts`), Prisma ORM, SQLite (`db/`).
- **Auth:** passwords hashed with Node `scrypt`; tokens are `base64(payload).base64(HMAC-SHA256(payload, AUTH_SECRET))` — set `AUTH_SECRET` in the environment for production.
- **Ownership:** all reads/writes filter by `userId` from the verified token; foreign IDs surface as `404`.
- **Milestone engine:** `checkMilestones()` runs after completing chant/yoga/meditation/journal actions and upserts `Milestone` rows (`@@unique([userId, key])` — no duplicates).
- **Timezone:** all day aggregation uses IST (+05:30) via `dateKey()`.
