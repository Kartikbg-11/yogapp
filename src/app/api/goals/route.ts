import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAuth, badRequest, dateKey, addDays, clampInt } from '@/lib/api-helpers'

async function buildGoal(userId: string, date: string) {
  const targets = await db.dailyGoal.upsert({
    where: { userId_date: { userId, date } },
    update: {},
    create: { userId, date },
  })
  const dayStart = new Date(date + 'T00:00:00Z')
  const dayEnd = new Date(addDays(date, 1) + 'T00:00:00Z')

  const [yogaDone, meditationAgg, chantAgg] = await Promise.all([
    db.yogaSession.count({
      where: { userId, completed: true, createdAt: { gte: dayStart, lt: dayEnd } },
    }),
    db.meditationSession.aggregate({
      where: { userId, completed: true, createdAt: { gte: dayStart, lt: dayEnd } },
      _sum: { durationSec: true },
    }),
    db.chantSession.aggregate({
      where: { userId, createdAt: { gte: dayStart, lt: dayEnd } },
      _sum: { count: true },
    }),
  ])

  return {
    date,
    yogaTarget: targets.yogaTarget,
    meditationTarget: targets.meditationTarget,
    chantTarget: targets.chantTarget,
    yogaDone,
    meditationDone: Math.floor((meditationAgg._sum.durationSec ?? 0) / 60),
    chantDone: chantAgg._sum.count ?? 0,
  }
}

/** GET /api/goals?date=YYYY-MM-DD — targets + derived completion for a day. */
export async function GET(req: NextRequest) {
  return withAuth(req, async (userId) => {
    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date') ?? dateKey()
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return badRequest('Invalid date format')
    return NextResponse.json({ goal: await buildGoal(userId, date) })
  })
}

/** PATCH /api/goals — upsert targets for a date. */
export async function PATCH(req: NextRequest) {
  return withAuth(req, async (userId) => {
    const body = await req.json().catch(() => null)
    if (!body) return badRequest('Invalid JSON body')
    const date = typeof body.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.date) ? body.date : dateKey()
    const data: { yogaTarget?: number; meditationTarget?: number; chantTarget?: number } = {}
    if (body.yogaTarget !== undefined) data.yogaTarget = clampInt(body.yogaTarget, 1, 10, 1)
    if (body.meditationTarget !== undefined) data.meditationTarget = clampInt(body.meditationTarget, 5, 240, 10)
    if (body.chantTarget !== undefined) data.chantTarget = clampInt(body.chantTarget, 27, 1008, 108)
    await db.dailyGoal.upsert({
      where: { userId_date: { userId, date } },
      update: data,
      create: { userId, date, ...data },
    })
    return NextResponse.json({ goal: await buildGoal(userId, date) })
  })
}
