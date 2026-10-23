import crypto from 'crypto'

const SECRET = process.env.AUTH_SECRET || 'innerpeace-dev-secret-change-in-production'
const TOKEN_DAYS = 30

/* ---------------- password hashing (scrypt, no external deps) ---------------- */

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [salt, hash] = stored.split(':')
    if (!salt || !hash) return false
    const candidate = crypto.scryptSync(password, salt, 64)
    const original = Buffer.from(hash, 'hex')
    if (candidate.length !== original.length) return false
    return crypto.timingSafeEqual(candidate, original)
  } catch {
    return false
  }
}

/* ---------------- token (HMAC-signed, JWT-like) ---------------- */

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url')
}

export function signToken(userId: string): string {
  const payload = b64url(
    JSON.stringify({ uid: userId, iat: Date.now(), exp: Date.now() + TOKEN_DAYS * 86400_000 })
  )
  const sig = crypto.createHmac('sha256', SECRET).update(payload).digest('base64url')
  return `${payload}.${sig}`
}

export function verifyToken(token: string): { uid: string } | null {
  try {
    const [payload, sig] = token.split('.')
    if (!payload || !sig) return null
    const expected = crypto.createHmac('sha256', SECRET).update(payload).digest('base64url')
    const a = Buffer.from(sig)
    const b = Buffer.from(expected)
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString())
    if (!data.uid || typeof data.exp !== 'number' || Date.now() > data.exp) return null
    return { uid: data.uid }
  } catch {
    return null
  }
}
