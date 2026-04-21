import bcrypt from 'bcryptjs'
import { db } from '@/db'
import { users } from '@/db/schema'
import { signToken, createAuthCookie } from '@/lib/auth'
import { loginSchema } from '@/lib/validations/auth'
import { eq } from 'drizzle-orm'

export async function POST(req: Request) {
  const body = await req.json()
  const result = loginSchema.safeParse(body)
  if (!result.success) {
    return Response.json(
      { error: 'Validation failed', details: result.error.flatten() },
      { status: 400 }
    )
  }

  const { email, password } = result.data

  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1)

    // Use constant-time comparison to avoid timing attacks
    const passwordMatch = user
      ? await bcrypt.compare(password, user.password)
      : await bcrypt.compare(password, '$2b$12$invalidhashfortimingprotection')

    if (!user || !passwordMatch) {
      // Return same error for wrong email or wrong password — never reveal which
      return Response.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const token = await signToken({ userId: user.id, email: user.email })
    const cookie = createAuthCookie(token)

    const response = Response.json({
      user: { id: user.id, email: user.email, name: user.name, username: user.username },
    })
    response.headers.set(
      'Set-Cookie',
      `${cookie.name}=${cookie.value}; HttpOnly; ${cookie.secure ? 'Secure; ' : ''}SameSite=Strict; Max-Age=${cookie.maxAge}; Path=/`
    )
    return response
  } catch (error) {
    console.error('[POST /api/auth/login]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
