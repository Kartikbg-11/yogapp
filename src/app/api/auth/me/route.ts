import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAuth } from '@/lib/api-helpers'

function publicUser(u: {
  id: string
  email: string
  name: string
  avatarSeed: string
  timezone: string
  createdAt: Date
}) {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    avatarSeed: u.avatarSeed,
    timezone: u.timezone,
    createdAt: u.createdAt,
  }
}

/** GET /api/auth/me — current user profile. */
export async function GET(req: NextRequest) {
  return withAuth(req, async (userId) => {
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    return NextResponse.json({ user: publicUser(user) })
  })
}

/** PATCH /api/auth/me — update profile name / timezone. */
export async function PATCH(req: NextRequest) {
  return withAuth(req, async (userId) => {
    const body = await req.json().catch(() => ({}))
    const data: { name?: string; timezone?: string } = {}
    if (typeof body.name === 'string' && body.name.trim().length >= 2) data.name = body.name.trim()
    if (typeof body.timezone === 'string' && body.timezone) data.timezone = body.timezone
    const user = await db.user.update({ where: { id: userId }, data })
    return NextResponse.json({ user: publicUser(user) })
  })
}

/** DELETE /api/auth/me — permanently delete the account and all owned data (cascades). */
export async function DELETE(req: NextRequest) {
  return withAuth(req, async (userId) => {
    await db.user.delete({ where: { id: userId } })
    return NextResponse.json({ ok: true })
  })
}
