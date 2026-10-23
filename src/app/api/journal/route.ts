import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAuth, badRequest, clampInt, dateKey } from '@/lib/api-helpers'

const CATEGORIES = ['gratitude', 'reflection', 'goals', 'meditation']

/** GET /api/journal — search/filter/paginate journal entries. */
export async function GET(req: NextRequest) {
  return withAuth(req, async (userId) => {
    const { searchParams } = new URL(req.url)
    const search = (searchParams.get('search') ?? '').trim()
    const category = searchParams.get('category') ?? ''
    const from = searchParams.get('from') ?? ''
    const to = searchParams.get('to') ?? ''
    const page = clampInt(searchParams.get('page'), 1, 10000, 1)
    const pageSize = clampInt(searchParams.get('pageSize'), 1, 50, 20)

    const where: Record<string, unknown> = { userId }
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } },
      ]
    }
    if (category && CATEGORIES.includes(category)) where.category = category
    if (from && to) where.entryDate = { gte: from, lte: to }
    else if (from) where.entryDate = { gte: from }
    else if (to) where.entryDate = { lte: to }

    const [total, rows] = await Promise.all([
      db.journalEntry.count({ where }),
      db.journalEntry.findMany({
        where,
        orderBy: [{ entryDate: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ])
    return NextResponse.json({ entries: rows, total, page, pageSize })
  })
}

/** POST /api/journal — create an entry. */
export async function POST(req: NextRequest) {
  return withAuth(req, async (userId) => {
    const body = await req.json().catch(() => null)
    if (!body) return badRequest('Invalid JSON body')
    const title = String(body.title ?? '').trim()
    const content = String(body.content ?? '').trim()
    if (!title) return badRequest('Title is required')
    if (!content) return badRequest('Content is required')
    const category = CATEGORIES.includes(String(body.category)) ? String(body.category) : 'reflection'
    const entryDate =
      typeof body.entryDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.entryDate)
        ? body.entryDate
        : dateKey()
    const entry = await db.journalEntry.create({
      data: {
        userId,
        title,
        content,
        category,
        mood: typeof body.mood === 'string' && body.mood ? body.mood : null,
        entryDate,
      },
    })
    return NextResponse.json({ entry }, { status: 201 })
  })
}
