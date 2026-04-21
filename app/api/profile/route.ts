import { db } from '@/db'
import { users } from '@/db/schema'
import { getAuthUser, clearAuthCookie } from '@/lib/auth'
import { updateNameSchema, changePasswordSchema } from '@/lib/validations/profile'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

export async function PATCH(req: Request) {
  // 1. Authenticate
  const user = await getAuthUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Parse and validate body
  const body = await req.json()

  // Determine which action based on fields present
  const isPasswordChange = 'currentPassword' in body && 'newPassword' in body
  const isNameUpdate = 'name' in body && !isPasswordChange

  if (!isPasswordChange && !isNameUpdate) {
    return Response.json(
      { error: 'Invalid request. Provide either "name" or both "currentPassword" and "newPassword"' },
      { status: 400 }
    )
  }

  try {
    // Handle password change
    if (isPasswordChange) {
      const result = changePasswordSchema.safeParse(body)
      if (!result.success) {
        return Response.json(
          { error: 'Validation failed', details: result.error.flatten() },
          { status: 400 }
        )
      }

      const { currentPassword, newPassword } = result.data

      // Fetch current user with password hash
      const [existingUser] = await db
        .select({ id: users.id, password: users.password })
        .from(users)
        .where(eq(users.id, user.userId))
        .limit(1)

      if (!existingUser) {
        return Response.json({ error: 'User not found' }, { status: 404 })
      }

      // Verify current password
      const passwordMatch = await bcrypt.compare(currentPassword, existingUser.password)
      if (!passwordMatch) {
        return Response.json({ error: 'Current password is incorrect' }, { status: 403 })
      }

      // Hash new password and update
      const hashedPassword = await bcrypt.hash(newPassword, 12)
      await db
        .update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, user.userId))

      return Response.json({ message: 'Password changed successfully' })
    }

    // Handle name update
    if (isNameUpdate) {
      const result = updateNameSchema.safeParse(body)
      if (!result.success) {
        return Response.json(
          { error: 'Validation failed', details: result.error.flatten() },
          { status: 400 }
        )
      }

      const { name } = result.data

      const [updated] = await db
        .update(users)
        .set({ name })
        .where(eq(users.id, user.userId))
        .returning({ id: users.id, name: users.name, email: users.email })

      return Response.json({
        message: 'Profile updated successfully',
        user: updated,
      })
    }
  } catch (error) {
    console.error('[PATCH /api/profile]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }

  // Fallback (should never reach here)
  return Response.json({ error: 'Invalid request' }, { status: 400 })
}

export async function DELETE(req: Request) {
  // 1. Authenticate
  const user = await getAuthUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Delete user — cascade will remove all associated data
  try {
    await db.delete(users).where(eq(users.id, user.userId))

    // Clear auth cookie to log user out
    const cookie = clearAuthCookie()
    const response = Response.json({ message: 'Account deleted successfully' })
    response.headers.set(
      'Set-Cookie',
      `${cookie.name}=${cookie.value}; HttpOnly; ${cookie.secure ? 'Secure; ' : ''}SameSite=Strict; Max-Age=${cookie.maxAge}; Path=/`
    )
    return response
  } catch (error) {
    console.error('[DELETE /api/profile]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
