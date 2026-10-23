import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAuth, badRequest, clampInt, checkMilestones } from '@/lib/api-helpers'

/** GET /api/meditation/sessions?limit=20 — recent meditation sessions. */
export async function GET(req: NextRequest) {
  return withAuth(req, async (userId) => {
    const { searchParams } = new URL(req.url)
    const limit = clampInt(searchParams.get('limit'), 1, 100, 20)
    const sessions = await db.meditationSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
    return NextResponse.json({ sessions })
  })
}

/** POST /api/meditation/sessions — record a meditation sit. */
export async function POST(req: NextRequest) {
  return withAuth(req, async (userId) => {
    const body = await req.json().catch(() => null)
    if (!body) return badRequest('Invalid JSON body')
    const session = await db.meditationSession.create({
      data: {
        userId,
        plannedSec: clampInt(body.plannedSec, 0, 4 * 3600, 0),
        durationSec: clampInt(body.durationSec, 0, 4 * 3600, 0),
        ambient: typeof body.ambient === 'string' && body.ambient ? body.ambient : null,
        completed: Boolean(body.completed),
      },
    })
    const milestones = await checkMilestones(userId)
    return NextResponse.json({ session, milestones }, { status: 201 })
  })
}
