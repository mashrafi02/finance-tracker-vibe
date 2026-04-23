import { db } from '@/db'
import { savingsGoals } from '@/db/schema'
import { getAuthUser } from '@/lib/auth'
import { createSavingsGoalSchema } from '@/lib/validations/savings'
import { eq } from 'drizzle-orm'

export async function GET() {
  // 1. Authenticate
  const user = await getAuthUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Query all savings goals for this user
  try {
    const goals = await db
      .select()
      .from(savingsGoals)
      .where(eq(savingsGoals.userId, user.userId))
      .orderBy(savingsGoals.createdAt)

    return Response.json({ goals }, {
      headers: {
        'Cache-Control': 'private, max-age=15, stale-while-revalidate=120',
      },
    })
  } catch (error) {
    console.error('[GET /api/savings-goals]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  // 1. Authenticate
  const user = await getAuthUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Parse and validate body
  const body = await req.json()
  const result = createSavingsGoalSchema.safeParse(body)
  if (!result.success) {
    return Response.json(
      { error: 'Validation failed', details: result.error.flatten() },
      { status: 400 }
    )
  }

  const { name, targetAmount } = result.data

  // 3. Insert new savings goal
  try {
    const [goal] = await db
      .insert(savingsGoals)
      .values({
        userId: user.userId,
        name,
        targetAmount: targetAmount.toString(),
        savedAmount: '0',
      })
      .returning()

    return Response.json(goal, { status: 201 })
  } catch (error) {
    console.error('[POST /api/savings-goals]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
