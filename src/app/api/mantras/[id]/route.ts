import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAuth } from '@/lib/api-helpers'

/** DELETE /api/mantras/:id — remove a custom mantra (owner only). */
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return withAuth(req, async (userId) => {
    const { id } = await ctx.params
    const mantra = await db.mantra.findUnique({ where: { id } })
    if (!mantra || mantra.userId !== userId) {
      return NextResponse.json({ error: 'Mantra not found' }, { status: 404 })
    }
    await db.mantra.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  })
}
