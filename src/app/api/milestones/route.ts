import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAuth } from '@/lib/api-helpers'

/** GET /api/milestones — user's achieved milestones. */
export async function GET(req: NextRequest) {
  return withAuth(req, async (userId) => {
    const milestones = await db.milestone.findMany({
      where: { userId },
      orderBy: { achievedAt: 'desc' },
    })
    return NextResponse.json({ milestones })
  })
}
