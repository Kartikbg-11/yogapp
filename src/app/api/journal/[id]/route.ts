import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAuth, badRequest } from '@/lib/api-helpers'

const CATEGORIES = ['gratitude', 'reflection', 'goals', 'meditation']

/** GET /api/journal/:id — read one entry (owner only). */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return withAuth(req, async (userId) => {
    const { id } = await ctx.params
    const entry = await db.journalEntry.findUnique({ where: { id } })
    if (!entry || entry.userId !== userId) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }
    return NextResponse.json({ entry })
  })
}

/** PATCH /api/journal/:id — update an entry (owner only). */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return withAuth(req, async (userId) => {
    const { id } = await ctx.params
    const existing = await db.journalEntry.findUnique({ where: { id } })
    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }
    const body = await req.json().catch(() => null)
    if (!body) return badRequest('Invalid JSON body')
    const data: Record<string, unknown> = {}
    if (body.title !== undefined) {
      const t = String(body.title).trim()
      if (!t) return badRequest('Title is required')
      data.title = t
    }
    if (body.content !== undefined) {
      const c = String(body.content).trim()
      if (!c) return badRequest('Content is required')
      data.content = c
    }
    if (body.category !== undefined && CATEGORIES.includes(String(body.category))) {
      data.category = String(body.category)
    }
    if (body.mood !== undefined) {
      data.mood = typeof body.mood === 'string' && body.mood ? body.mood : null
    }
    if (body.entryDate !== undefined && /^\d{4}-\d{2}-\d{2}$/.test(String(body.entryDate))) {
      data.entryDate = String(body.entryDate)
    }
    const entry = await db.journalEntry.update({ where: { id }, data })
    return NextResponse.json({ entry })
  })
}

/** DELETE /api/journal/:id — remove an entry (owner only). */
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return withAuth(req, async (userId) => {
    const { id } = await ctx.params
    const existing = await db.journalEntry.findUnique({ where: { id } })
    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }
    await db.journalEntry.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  })
}
