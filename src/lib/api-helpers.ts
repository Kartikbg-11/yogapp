import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { db } from '@/lib/db'

/** Extract authenticated user id from the Authorization header, or null. */
export function getUserId(req: NextRequest): string | null {
  const header = req.headers.get('authorization') || ''
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : ''
  if (!token) return null
  return verifyToken(token)?.uid ?? null
}

/** Standard 401 response. */
export function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 })
}

/** Standard validation error response. */
export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 })
}

/** Standard not-found response. */
export function notFound(message = 'Resource not found') {
  return NextResponse.json({ error: message }, { status: 404 })
}

/** Wrap a route handler with auth + error handling. Returns the userId or an error response. */
export async function withAuth(
  req: NextRequest,
  fn: (userId: string) => Promise<NextResponse>
): Promise<NextResponse> {
  const userId = getUserId(req)
  if (!userId) return unauthorized()
  try {
    return await fn(userId)
  } catch (err) {
    console.error('[api-error]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/** Local date key (YYYY-MM-DD) for a Date, using the IST offset (+5:30) by default. */
export function dateKey(d: Date = new Date(), offsetMinutes = 330): string {
  const shifted = new Date(d.getTime() + offsetMinutes * 60_000)
  return shifted.toISOString().slice(0, 10)
}

export function addDays(key: string, days: number): string {
  const d = new Date(key + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === 'number' ? Math.round(value) : parseInt(String(value), 10)
  if (Number.isNaN(n)) return fallback
  return Math.min(max, Math.max(min, n))
}

/* ---------------- streaks & milestones ---------------- */

export async function computeStreaks(userId: string): Promise<{ current: number; longest: number }> {
  const [chants, yoga, meditation] = await Promise.all([
    db.chantSession.findMany({ where: { userId, completed: true }, select: { createdAt: true } }),
    db.yogaSession.findMany({ where: { userId, completed: true }, select: { createdAt: true } }),
    db.meditationSession.findMany({
      where: { userId, completed: true, durationSec: { gte: 60 } },
      select: { createdAt: true },
    }),
  ])
  const days = new Set<string>()
  for (const list of [chants, yoga, meditation]) {
    for (const row of list) days.add(dateKey(row.createdAt))
  }
  if (days.size === 0) return { current: 0, longest: 0 }
  const sorted = Array.from(days).sort()
  // longest streak
  let longest = 1
  let run = 1
  for (let i = 1; i < sorted.length; i++) {
    if (addDays(sorted[i - 1], 1) === sorted[i]) {
      run++
      longest = Math.max(longest, run)
    } else {
      run = 1
    }
  }
  // current streak: ends today or yesterday
  const today = dateKey()
  const yesterday = addDays(today, -1)
  let current = 0
  if (days.has(today) || days.has(yesterday)) {
    let cursor = days.has(today) ? today : yesterday
    current = 1
    while (days.has(addDays(cursor, -1))) {
      cursor = addDays(cursor, -1)
      current++
    }
  }
  return { current, longest }
}

const MILESTONES: Array<{
  key: string
  title: string
  description: string
  icon: string
  check: (ctx: MilestoneContext) => boolean
}> = [
  {
    key: 'first_session',
    title: 'First Steps',
    description: 'Completed your first wellness session',
    icon: 'sparkles',
    check: (c) => c.totalSessions >= 1,
  },
  {
    key: 'chants_108',
    title: 'Sacred 108',
    description: 'Chanted 108 total repetitions',
    icon: 'om',
    check: (c) => c.totalChants >= 108,
  },
  {
    key: 'chants_1080',
    title: 'Devoted Chanter',
    description: 'Chanted 1,080 total repetitions',
    icon: 'om',
    check: (c) => c.totalChants >= 1080,
  },
  {
    key: 'mala_10',
    title: 'Mala Master',
    description: 'Completed 10 full mala rounds',
    icon: 'circle-dot',
    check: (c) => c.totalMalaRounds >= 10,
  },
  {
    key: 'streak_7',
    title: 'Unbroken Week',
    description: 'Maintained a 7-day practice streak',
    icon: 'flame',
    check: (c) => c.streak.longest >= 7,
  },
  {
    key: 'streak_30',
    title: 'Monthly Devotee',
    description: 'Maintained a 30-day practice streak',
    icon: 'flame',
    check: (c) => c.streak.longest >= 30,
  },
  {
    key: 'meditation_60',
    title: 'Still Mind',
    description: 'Meditated for 60 total minutes',
    icon: 'brain',
    check: (c) => c.totalMeditationMinutes >= 60,
  },
  {
    key: 'meditation_300',
    title: 'Deep Stillness',
    description: 'Meditated for 300 total minutes',
    icon: 'brain',
    check: (c) => c.totalMeditationMinutes >= 300,
  },
  {
    key: 'yoga_10',
    title: 'Flexible Spirit',
    description: 'Completed 10 yoga sessions',
    icon: 'flower',
    check: (c) => c.totalYogaSessions >= 10,
  },
  {
    key: 'journal_5',
    title: 'Reflected Soul',
    description: 'Wrote 5 journal entries',
    icon: 'book-heart',
    check: (c) => c.totalJournalEntries >= 5,
  },
]

export interface MilestoneContext {
  totalChants: number
  totalMalaRounds: number
  totalYogaSessions: number
  totalMeditationMinutes: number
  totalSessions: number
  totalJournalEntries: number
  streak: { current: number; longest: number }
}

/** Award any newly-earned milestones. Returns the list of newly achieved ones. */
export async function checkMilestones(userId: string): Promise<Array<{ key: string; title: string; description: string; icon: string }>> {
  const [chants, yoga, meditation, journal, streak] = await Promise.all([
    db.chantSession.aggregate({ where: { userId }, _sum: { count: true } }),
    db.yogaSession.count({ where: { userId, completed: true } }),
    db.meditationSession.aggregate({
      where: { userId },
      _sum: { durationSec: true },
    }),
    db.journalEntry.count({ where: { userId } }),
    computeStreaks(userId),
  ])
  const chantCount = chants._sum.count ?? 0
  const malaRounds = Math.floor(chantCount / 108)
  const meditationMin = Math.floor((meditation._sum.durationSec ?? 0) / 60)
  const yogaCount = yoga
  const totalSessions = yogaCount + meditationMin + Math.floor(chantCount / 27)
  const ctx: MilestoneContext = {
    totalChants: chantCount,
    totalMalaRounds: malaRounds,
    totalYogaSessions: yogaCount,
    totalMeditationMinutes: meditationMin,
    totalSessions,
    totalJournalEntries: journal,
    streak,
  }
  const existing = await db.milestone.findMany({ where: { userId }, select: { key: true } })
  const have = new Set(existing.map((m) => m.key))
  const newly: Array<{ key: string; title: string; description: string; icon: string }> = []
  for (const m of MILESTONES) {
    if (!have.has(m.key) && m.check(ctx)) {
      await db.milestone.create({
        data: { userId, key: m.key, title: m.title, description: m.description, icon: m.icon },
      })
      newly.push({ key: m.key, title: m.title, description: m.description, icon: m.icon })
    }
  }
  return newly
}
