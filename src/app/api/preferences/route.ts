import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAuth, badRequest, clampInt } from '@/lib/api-helpers'

const DEFAULTS = {
  theme: 'dark',
  soundEnabled: true,
  hapticsEnabled: true,
  dailyReminder: false,
  reminderTime: '06:30',
  motivationalQuotes: true,
  preferredMantraId: null as string | null,
  defaultChantTarget: 108,
  dailyYogaGoal: 1,
  dailyMeditationGoal: 10,
  dailyChantGoal: 108,
}

/** GET /api/preferences — current preferences (created on first access). */
export async function GET(req: NextRequest) {
  return withAuth(req, async (userId) => {
    const prefs = await db.preference.upsert({ where: { userId }, update: {}, create: { userId } })
    return NextResponse.json({ preferences: prefs })
  })
}

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/

/** PATCH /api/preferences — partial update with validation. */
export async function PATCH(req: NextRequest) {
  return withAuth(req, async (userId) => {
    const body = await req.json().catch(() => null)
    if (!body) return badRequest('Invalid JSON body')
    const data: Record<string, unknown> = {}

    if (body.theme !== undefined) {
      if (!['light', 'dark'].includes(body.theme)) return badRequest('theme must be light or dark')
      data.theme = body.theme
    }
    for (const key of ['soundEnabled', 'hapticsEnabled', 'dailyReminder', 'motivationalQuotes'] as const) {
      if (body[key] !== undefined) data[key] = Boolean(body[key])
    }
    if (body.reminderTime !== undefined) {
      if (!TIME_RE.test(String(body.reminderTime))) return badRequest('reminderTime must be HH:MM')
      data.reminderTime = body.reminderTime
    }
    if (body.preferredMantraId !== undefined) {
      data.preferredMantraId = typeof body.preferredMantraId === 'string' ? body.preferredMantraId : null
    }
    if (body.defaultChantTarget !== undefined) {
      const allowed = [27, 54, 108, 216, 1008]
      const v = clampInt(body.defaultChantTarget, 27, 1008, 108)
      if (!allowed.includes(v)) return badRequest('defaultChantTarget must be one of 27, 54, 108, 216, 1008')
      data.defaultChantTarget = v
    }
    if (body.dailyYogaGoal !== undefined) data.dailyYogaGoal = clampInt(body.dailyYogaGoal, 1, 10, 1)
    if (body.dailyMeditationGoal !== undefined)
      data.dailyMeditationGoal = clampInt(body.dailyMeditationGoal, 5, 240, 10)
    if (body.dailyChantGoal !== undefined) data.dailyChantGoal = clampInt(body.dailyChantGoal, 27, 1008, 108)

    const prefs = await db.preference.upsert({
      where: { userId },
      update: data,
      create: { userId, ...DEFAULTS, ...data },
    })
    return NextResponse.json({ preferences: prefs })
  })
}
