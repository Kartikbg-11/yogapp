import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAuth, badRequest, clampInt, checkMilestones } from '@/lib/api-helpers'

/** GET /api/yoga/sessions?limit=20 — recent yoga sessions. */
export async function GET(req: NextRequest) {
  return withAuth(req, async (userId) => {
    const { searchParams } = new URL(req.url)
    const limit = clampInt(searchParams.get('limit'), 1, 100, 20)
    const sessions = await db.yogaSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
    return NextResponse.json({ sessions })
  })
}

/** POST /api/yoga/sessions — record a completed (or partial) yoga practice. */
export async function POST(req: NextRequest) {
  return withAuth(req, async (userId) => {
    const body = await req.json().catch(() => null)
    if (!body) return badRequest('Invalid JSON body')
    const routineTitle = String(body.routineTitle ?? '').trim()
    if (!routineTitle) return badRequest('routineTitle is required')
    const session = await db.yogaSession.create({
      data: {
        userId,
        routineId: typeof body.routineId === 'string' ? body.routineId : null,
        routineTitle,
        durationSec: clampInt(body.durationSec, 0, 6 * 3600, 0),
        completed: Boolean(body.completed),
      },
    })
    const milestones = await checkMilestones(userId)
    return NextResponse.json({ session, milestones }, { status: 201 })
  })
}
