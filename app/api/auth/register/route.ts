import bcrypt from 'bcryptjs'
import { db } from '@/db'
import { users, accounts } from '@/db/schema'
import { signToken, createAuthCookie } from '@/lib/auth'
import { registerSchema } from '@/lib/validations/auth'
import { eq, or } from 'drizzle-orm'

export async function POST(req: Request) {
  const body = await req.json()
  const result = registerSchema.safeParse(body)
  if (!result.success) {
    return Response.json(
      { error: 'Validation failed', details: result.error.flatten() },
      { status: 400 }
    )
  }

  const { email, username, password, name } = result.data

  try {
    // Check for existing user with same email or username
    const [existing] = await db
      .select({ id: users.id, email: users.email, username: users.username })
      .from(users)
      .where(or(eq(users.email, email.toLowerCase()), eq(users.username, username.toLowerCase())))
      .limit(1)

    if (existing) {
      if (existing.email === email.toLowerCase()) {
        return Response.json(
          { error: 'An account with this email already exists' },
          { status: 409 }
        )
      }
      if (existing.username === username.toLowerCase()) {
        return Response.json(
          { error: 'This username is already taken' },
          { status: 409 }
        )
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    
    // Use transaction to create user and account atomically
    const user = await db.transaction(async (tx) => {
      const [newUser] = await tx
        .insert(users)
        .values({
          email: email.toLowerCase(),
          username: username.toLowerCase(),
          password: hashedPassword,
          name,
        })
        .returning({ id: users.id, email: users.email, name: users.name, username: users.username })

      // Create account with initial balance of 0
      await tx
        .insert(accounts)
        .values({
          userId: newUser.id,
          balance: '0',
        })

      return newUser
    })

    const token = await signToken({ userId: user.id, email: user.email })
    const cookie = createAuthCookie(token)

    const response = Response.json({ user }, { status: 201 })
    response.headers.set(
      'Set-Cookie',
      `${cookie.name}=${cookie.value}; HttpOnly; ${cookie.secure ? 'Secure; ' : ''}SameSite=Strict; Max-Age=${cookie.maxAge}; Path=/`
    )
    return response
  } catch (error) {
    console.error('[POST /api/auth/register]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
