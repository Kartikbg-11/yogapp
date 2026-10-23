import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAuth, clampInt, checkMilestones } from '@/lib/api-helpers'

/**
 * PATCH /api/chant-sessions/:id — absolute progress update (idempotent-safe).
 * Body: { count?, durationSec?, completed? } — values are absolute, never increments.
 */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return withAuth(req, async (userId) => {
    const { id } = await ctx.params
    const existing = await db.chantSession.findUnique({ where: { id } })
    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const body = await req.json().catch(() => ({}))
    const data: { count?: number; durationSec?: number; completed?: boolean } = {}

    if (body.count !== undefined) {
      // clamp: never negative, cap at 2 full malas beyond target to avoid runaway
      data.count = clampInt(body.count, 0, existing.target * 2 + 108, existing.count)
    }
    if (body.durationSec !== undefined) {
      data.durationSec = clampInt(body.durationSec, 0, 6 * 3600, existing.durationSec)
    }
    if (body.completed !== undefined) {
      data.completed = Boolean(body.completed)
    } else if (data.count !== undefined) {
      data.completed = data.count >= existing.target
    }

    const session = await db.chantSession.update({ where: { id }, data })

    let milestones: unknown[] = []
    if (session.completed && !existing.completed) {
      milestones = await checkMilestones(userId)
    }
    return NextResponse.json({ session, milestones })
  })
}

/** GET /api/chant-sessions/:id — fetch one (owner only). */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return withAuth(req, async (userId) => {
    const { id } = await ctx.params
    const session = await db.chantSession.findUnique({ where: { id } })
    if (!session || session.userId !== userId) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }
    return NextResponse.json({ session })
  })
}
