import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { cache } from 'react'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { users } from '@/db/schema'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!)
const COOKIE_NAME = 'auth-token'
const TOKEN_EXPIRY = '7d'

export interface JWTPayload {
  userId: string
  email: string
}

/**
 * Sign a JWT with the user's id and email.
 * Called only in /api/auth/login and /api/auth/register.
 */
export async function signToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(JWT_SECRET)
}

/**
 * Verify and decode a JWT string.
 * Returns the payload or null if invalid/expired.
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as JWTPayload
  } catch {
    return null
  }
}

/**
 * Read the auth cookie and return the verified JWT payload.
 * Use this in every protected API route handler and Server Component.
 * Returns null if unauthenticated or token is expired.
 *
 * Wrapped in React.cache so a single request that calls this from a layout
 * AND a page (common in the dashboard) only verifies the JWT once.
 */
export const getAuthUser = cache(
  async (): Promise<JWTPayload | null> => {
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value
    if (!token) return null
    return verifyToken(token)
  },
)

/**
 * Fetch the user's display name from the database.
 * Cached per-request so layout + page don't run the same query twice.
 */
export const getUserDisplayName = cache(
  async (userId: string, email: string): Promise<string> => {
    const [row] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    const emailPrefix = email.split('@')[0] ?? ''
    return (
      row?.name?.trim() ||
      emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1)
    )
  },
)

/**
 * Returns a cookie config object for setting the auth cookie.
 * httpOnly + secure + sameSite=strict prevents XSS and CSRF.
 */
export function createAuthCookie(token: string) {
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
    path: '/',
  }
}

/**
 * Returns a cookie config that expires immediately (for logout).
 */
export function clearAuthCookie() {
  return {
    name: COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: 0,
    path: '/',
  }
}
