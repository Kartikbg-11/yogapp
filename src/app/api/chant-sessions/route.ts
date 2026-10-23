import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { badRequest, withAuth, clampInt, checkMilestones } from '@/lib/api-helpers'

const ACTIVE_WINDOW_MS = 24 * 3600_000

/** GET /api/chant-sessions?limit=20 | ?active=1 */
export async function GET(req: NextRequest) {
  return withAuth(req, async (userId) => {
    const { searchParams } = new URL(req.url)
    if (searchParams.get('active') === '1') {
      const since = new Date(Date.now() - ACTIVE_WINDOW_MS)
      const active = await db.chantSession.findFirst({
        where: { userId, completed: false, updatedAt: { gte: since } },
        orderBy: { updatedAt: 'desc' },
      })
      return NextResponse.json({ active })
    }
    const limit = clampInt(searchParams.get('limit'), 1, 100, 20)
    const sessions = await db.chantSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
    return NextResponse.json({ sessions })
  })
}

/** POST /api/chant-sessions — create or upsert (idempotent via client id). */
export async function POST(req: NextRequest) {
  return withAuth(req, async (userId) => {
    const body = await req.json().catch(() => null)
    if (!body) return badRequest('Invalid JSON body')
    const id = typeof body.id === 'string' && body.id.length >= 8 ? body.id : undefined
    const mantraName = String(body.mantraName ?? '').trim() || 'Om'
    const mantraId = typeof body.mantraId === 'string' ? body.mantraId : null
    const target = clampInt(body.target, 27, 1008, 108)
    const count = clampInt(body.count, 0, 1008, 0)

    const session = id
      ? await db.chantSession.upsert({
          where: { id },
          // update only if it belongs to the caller
          update: { count, target, mantraName, mantraId },
          create: { id, userId, mantraName, mantraId, target, count },
        })
      : await db.chantSession.create({
          data: { userId, mantraName, mantraId, target, count },
        })

    // ownership guard on upsert
    if (session.userId !== userId) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    let milestones: unknown[] = []
    if (session.completed) {
      milestones = await checkMilestones(userId)
    }
    return NextResponse.json({ session, milestones }, { status: id ? 200 : 201 })
  })
}
