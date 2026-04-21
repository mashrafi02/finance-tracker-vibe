import bcrypt from 'bcryptjs'
import { db } from '@/db'
import { users, categories } from '@/db/schema'
import { signToken, createAuthCookie } from '@/lib/auth'
import { registerSchema } from '@/lib/validations/auth'
import { eq, or } from 'drizzle-orm'

// Default categories to seed for new users
const DEFAULT_CATEGORIES = [
  // Income categories
  { name: 'Salary', color: '#22c55e', icon: '💰' },
  { name: 'Freelance', color: '#10b981', icon: '💼' },
  { name: 'Investments', color: '#14b8a6', icon: '📈' },
  { name: 'Gifts', color: '#06b6d4', icon: '🎁' },
  { name: 'Other Income', color: '#0ea5e9', icon: '💵' },
  // Expense categories
  { name: 'Groceries', color: '#f59e0b', icon: '🛒' },
  { name: 'Transport', color: '#ef4444', icon: '🚗' },
  { name: 'Rent', color: '#dc2626', icon: '🏠' },
  { name: 'Utilities', color: '#f97316', icon: '💡' },
  { name: 'Entertainment', color: '#a855f7', icon: '🎬' },
  { name: 'Shopping', color: '#ec4899', icon: '🛍️' },
  { name: 'Healthcare', color: '#06b6d4', icon: '🏥' },
  { name: 'Dining', color: '#f43f5e', icon: '🍽️' },
  { name: 'Education', color: '#8b5cf6', icon: '📚' },
  { name: 'Other Expense', color: '#6b7280', icon: '📦' },
]

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
    const [user] = await db
      .insert(users)
      .values({
        email: email.toLowerCase(),
        username: username.toLowerCase(),
        password: hashedPassword,
        name,
      })
      .returning({ id: users.id, email: users.email, name: users.name, username: users.username })

    // Seed default categories for the new user
    await db.insert(categories).values(
      DEFAULT_CATEGORIES.map((cat) => ({
        ...cat,
        userId: user.id,
      }))
    )

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
