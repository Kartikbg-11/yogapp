import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { badRequest, withAuth } from '@/lib/api-helpers'

/** GET /api/mantras — global (predefined) + the user's custom mantras. */
export async function GET(req: NextRequest) {
  return withAuth(req, async (userId) => {
    const [globals, customs] = await Promise.all([
      db.mantra.findMany({ where: { userId: null }, orderBy: { name: 'asc' } }),
      db.mantra.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
    ])
    return NextResponse.json({
      mantras: [
        ...customs.map((m) => ({ ...m, isCustom: true })),
        ...globals.map((m) => ({ ...m, isCustom: false })),
      ],
    })
  })
}

/** POST /api/mantras — create a custom mantra. */
export async function POST(req: NextRequest) {
  return withAuth(req, async (userId) => {
    const body = await req.json().catch(() => null)
    if (!body) return badRequest('Invalid JSON body')
    const name = String(body.name ?? '').trim()
    const text = String(body.text ?? '').trim()
    const meaning = typeof body.meaning === 'string' ? body.meaning.trim() : ''
    if (name.length < 2) return badRequest('Mantra name must be at least 2 characters')
    if (!text) return badRequest('Mantra text is required')
    const mantra = await db.mantra.create({
      data: { userId, name, text, meaning: meaning || null, isCustom: true },
    })
    return NextResponse.json({ mantra: { ...mantra, isCustom: true } }, { status: 201 })
  })
}
