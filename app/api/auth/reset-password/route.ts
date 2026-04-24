import bcrypt from 'bcryptjs'
import { db } from '@/db'
import { users, passwordResetTokens } from '@/db/schema'
import { resetPasswordSchema } from '@/lib/validations/auth'
import { eq, and, gt } from 'drizzle-orm'

export async function POST(req: Request) {
  const body = await req.json()
  const result = resetPasswordSchema.safeParse(body)
  
  if (!result.success) {
    return Response.json(
      { error: 'Validation failed', details: result.error.flatten() },
      { status: 400 }
    )
  }

  const { token, newPassword } = result.data

  try {
    // Find the reset token in the database
    const [resetTokenRecord] = await db
      .select({
        id: passwordResetTokens.id,
        userId: passwordResetTokens.userId,
        expiresAt: passwordResetTokens.expiresAt,
      })
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token))
      .limit(1)

    // Check if token exists
    if (!resetTokenRecord) {
      return Response.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }

    // Check if token has expired
    const now = new Date()
    if (resetTokenRecord.expiresAt < now) {
      // Delete the expired token
      await db
        .delete(passwordResetTokens)
        .where(eq(passwordResetTokens.id, resetTokenRecord.id))
      
      return Response.json(
        { error: 'Reset token has expired. Please request a new password reset link.' },
        { status: 400 }
      )
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // Update the user's password
    await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, resetTokenRecord.userId))

    // Delete the used token to ensure it's single-use
    await db
      .delete(passwordResetTokens)
      .where(eq(passwordResetTokens.id, resetTokenRecord.id))

    return Response.json(
      { message: 'Password has been reset successfully.' },
      { status: 200 }
    )
  } catch (error) {
    console.error('[POST /api/auth/reset-password]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
