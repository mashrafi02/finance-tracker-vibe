import { db } from '@/db'
import { users, passwordResetTokens } from '@/db/schema'
import { forgotPasswordSchema } from '@/lib/validations/auth'
import { sendPasswordResetEmail } from '@/lib/email'
import { eq } from 'drizzle-orm'
import { randomBytes } from 'crypto'

export async function POST(req: Request) {
  const body = await req.json()
  const result = forgotPasswordSchema.safeParse(body)
  
  if (!result.success) {
    return Response.json(
      { error: 'Validation failed', details: result.error.flatten() },
      { status: 400 }
    )
  }

  const { email } = result.data

  try {
    // Find the user by email
    const [user] = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1)

    // Always return success to prevent email enumeration attacks
    // Don't reveal whether the user exists or not
    if (!user) {
      return Response.json(
        {
          message:
            'If an account with that email exists, a password reset link has been sent.',
        },
        { status: 200 }
      )
    }

    // Invalidate any existing reset tokens for this user
    await db
      .delete(passwordResetTokens)
      .where(eq(passwordResetTokens.userId, user.id))

    // Generate a secure random token (32 bytes = 64 hex characters)
    const resetToken = randomBytes(32).toString('hex')

    // Token expires in 1 hour
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 1)

    // Store the token in the database
    await db.insert(passwordResetTokens).values({
      token: resetToken,
      expiresAt,
      userId: user.id,
    })

    // Send the password reset email
    await sendPasswordResetEmail({
      to: user.email,
      resetToken,
    })

    return Response.json(
      {
        message:
          'If an account with that email exists, a password reset link has been sent.',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[POST /api/auth/forgot-password]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
