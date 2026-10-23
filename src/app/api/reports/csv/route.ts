import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAuth, dateKey, addDays, badRequest } from '@/lib/api-helpers'

function csvEscape(value: unknown): string {
  const s = String(value ?? '')
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

function toCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers.join(',')]
  for (const row of rows) lines.push(row.map(csvEscape).join(','))
  return lines.join('\r\n')
}

/** GET /api/reports/csv?type=yoga|meditation|chant|journal — downloadable CSV report. */
export async function GET(req: NextRequest) {
  return withAuth(req, async (userId) => {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') ?? ''
    const since = new Date(dateKey(new Date(addDays(dateKey(), -365))) + 'T00:00:00Z')

    let csv: string
    switch (type) {
      case 'yoga': {
        const rows = await db.yogaSession.findMany({
          where: { userId, createdAt: { gte: since } },
          orderBy: { createdAt: 'desc' },
        })
        csv = toCsv(
          ['Date', 'Routine', 'Duration (min)', 'Completed'],
          rows.map((r) => [dateKey(r.createdAt), r.routineTitle, Math.round(r.durationSec / 60), r.completed ? 'yes' : 'no'])
        )
        break
      }
      case 'meditation': {
        const rows = await db.meditationSession.findMany({
          where: { userId, createdAt: { gte: since } },
          orderBy: { createdAt: 'desc' },
        })
        csv = toCsv(
          ['Date', 'Planned (min)', 'Duration (min)', 'Ambient', 'Completed'],
          rows.map((r) => [
            dateKey(r.createdAt),
            Math.round(r.plannedSec / 60),
            Math.round(r.durationSec / 60),
            r.ambient ?? '',
            r.completed ? 'yes' : 'no',
          ])
        )
        break
      }
      case 'chant': {
        const rows = await db.chantSession.findMany({
          where: { userId, createdAt: { gte: since } },
          orderBy: { createdAt: 'desc' },
        })
        csv = toCsv(
          ['Date', 'Mantra', 'Count', 'Target', 'Mala Rounds', 'Duration (min)', 'Completed'],
          rows.map((r) => [
            dateKey(r.createdAt),
            r.mantraName,
            r.count,
            r.target,
            Math.floor(r.count / 108),
            Math.round(r.durationSec / 60),
            r.completed ? 'yes' : 'no',
          ])
        )
        break
      }
      case 'journal': {
        const rows = await db.journalEntry.findMany({
          where: { userId },
          orderBy: { entryDate: 'desc' },
        })
        csv = toCsv(
          ['Date', 'Title', 'Category', 'Mood', 'Content'],
          rows.map((r) => [r.entryDate, r.title, r.category, r.mood ?? '', r.content])
        )
        break
      }
      default:
        return badRequest('Unknown report type. Use yoga, meditation, chant or journal.')
    }

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="innerpeace-${type}-${dateKey()}.csv"`,
      },
    })
  })
}
