import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAuth, dateKey, addDays, clampInt, computeStreaks } from '@/lib/api-helpers'
import type { DayActivity } from '@/lib/types'

/** GET /api/analytics/summary?days=30 — totals, streaks, per-day activity, records, milestones. */
export async function GET(req: NextRequest) {
  return withAuth(req, async (userId) => {
    const { searchParams } = new URL(req.url)
    const days = clampInt(searchParams.get('days'), 1, 365, 30)

    const [chants, yoga, meditation, milestones, streak] = await Promise.all([
      db.chantSession.findMany({ where: { userId }, select: { count: true, createdAt: true } }),
      db.yogaSession.findMany({ where: { userId, completed: true }, select: { durationSec: true, createdAt: true } }),
      db.meditationSession.findMany({
        where: { userId, completed: true },
        select: { durationSec: true, createdAt: true },
      }),
      db.milestone.findMany({ where: { userId }, orderBy: { achievedAt: 'desc' } }),
      computeStreaks(userId),
    ])

    const totalChants = chants.reduce((s, c) => s + c.count, 0)
    const totalYogaMin = Math.floor(yoga.reduce((s, y) => s + y.durationSec, 0) / 60)
    const totalMedMin = Math.floor(meditation.reduce((s, m) => s + m.durationSec, 0) / 60)

    // per-day map for last N days (zero-filled)
    const map = new Map<string, DayActivity>()
    const today = dateKey()
    for (let i = days - 1; i >= 0; i--) {
      const d = addDays(today, -i)
      map.set(d, { date: d, yogaMin: 0, meditationMin: 0, chants: 0, yogaSessions: 0, meditationSessions: 0 })
    }
    const push = (createdAt: Date, key: keyof DayActivity, amount: number) => {
      const d = dateKey(createdAt)
      const row = map.get(d)
      if (row && typeof row[key] === 'number') {
        ;(row[key] as number) += amount
      }
    }
    for (const c of chants) push(c.createdAt, 'chants', c.count)
    for (const y of yoga) {
      push(y.createdAt, 'yogaMin', Math.floor(y.durationSec / 60))
      push(y.createdAt, 'yogaSessions', 1)
    }
    for (const m of meditation) {
      push(m.createdAt, 'meditationMin', Math.floor(m.durationSec / 60))
      push(m.createdAt, 'meditationSessions', 1)
    }
    const byDay = Array.from(map.values())

    // records
    const perDayChants = new Map<string, number>()
    for (const c of chants) {
      const d = dateKey(c.createdAt)
      perDayChants.set(d, (perDayChants.get(d) ?? 0) + c.count)
    }
    const activeDays = new Set<string>([
      ...chants.filter((c) => c.count > 0).map((c) => dateKey(c.createdAt)),
      ...yoga.map((y) => dateKey(y.createdAt)),
      ...meditation.map((m) => dateKey(m.createdAt)),
    ])

    return NextResponse.json({
      summary: {
        totals: {
          chants: totalChants,
          malaRounds: Math.floor(totalChants / 108),
          yogaSessions: yoga.length,
          yogaMinutes: totalYogaMin,
          meditationSessions: meditation.length,
          meditationMinutes: totalMedMin,
        },
        streak,
        byDay,
        milestones: milestones.map((m) => ({
          key: m.key,
          title: m.title,
          description: m.description,
          icon: m.icon,
          achievedAt: m.achievedAt,
        })),
        records: {
          longestChantSession: chants.reduce((mx, c) => Math.max(mx, c.count), 0),
          longestMeditation: meditation.reduce((mx, m) => Math.max(mx, m.durationSec), 0),
          mostChantsInADay: perDayChants.size ? Math.max(...perDayChants.values()) : 0,
          totalActiveDays: activeDays.size,
        },
      },
    })
  })
}
