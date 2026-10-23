import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAuth } from '@/lib/api-helpers'
import type { YogaPose } from '@/lib/types'

const LEVEL_ORDER: Record<string, number> = { beginner: 0, intermediate: 1, advanced: 2 }

/** GET /api/yoga/routines — all seeded routines with parsed JSON fields. */
export async function GET(req: NextRequest) {
  return withAuth(req, async () => {
    const rows = await db.yogaRoutine.findMany()
    const routines = rows
      .map((r) => ({
        id: r.id,
        title: r.title,
        slug: r.slug,
        category: r.category,
        level: r.level,
        durationMin: r.durationMin,
        imageKey: r.imageKey,
        description: r.description,
        benefits: JSON.parse(r.benefits) as string[],
        safety: JSON.parse(r.safety) as string[],
        poses: JSON.parse(r.poses) as YogaPose[],
      }))
      .sort(
        (a, b) =>
          (LEVEL_ORDER[a.level] ?? 3) - (LEVEL_ORDER[b.level] ?? 3) || a.title.localeCompare(b.title)
      )
    return NextResponse.json({ routines })
  })
}
