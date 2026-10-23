import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, signToken } from '@/lib/auth'
import { badRequest } from '@/lib/api-helpers'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** POST /api/auth/register — create account and return token. */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    if (!body) return badRequest('Invalid JSON body')
    const name = String(body.name ?? '').trim()
    const email = String(body.email ?? '').trim().toLowerCase()
    const password = String(body.password ?? '')

    if (name.length < 2) return badRequest('Name must be at least 2 characters')
    if (!EMAIL_RE.test(email)) return badRequest('Please enter a valid email address')
    if (password.length < 6) return badRequest('Password must be at least 6 characters')

    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 })
    }

    const user = await db.user.create({
      data: {
        name,
        email,
        passwordHash: hashPassword(password),
        preference: { create: {} },
      },
    })

    const token = signToken(user.id)
    return NextResponse.json(
      {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarSeed: user.avatarSeed,
          timezone: user.timezone,
          createdAt: user.createdAt,
        },
      },
      { status: 201 }
    )
  } catch (err) {
    console.error('[register]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
