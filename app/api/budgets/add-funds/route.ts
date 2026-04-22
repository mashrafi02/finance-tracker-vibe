import { db } from '@/db'
import { budgets } from '@/db/schema'
import { getAuthUser } from '@/lib/auth'
import { addFundsToBudgetSchema } from '@/lib/validations/budget'
import { eq, and } from 'drizzle-orm'

export async function POST(req: Request) {
  // 1. Authenticate
  const user = await getAuthUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Parse and validate body
  const body = await req.json()
  const result = addFundsToBudgetSchema.safeParse(body)
  if (!result.success) {
    return Response.json(
      { error: 'Validation failed', details: result.error.flatten() },
      { status: 400 }
    )
  }

  const { budgetId, amount } = result.data

  try {
    // 3. Find the budget and verify ownership
    const [existingBudget] = await db
      .select({
        id: budgets.id,
        userId: budgets.userId,
        limit: budgets.limit,
      })
      .from(budgets)
      .where(eq(budgets.id, budgetId))
      .limit(1)

    if (!existingBudget) {
      return Response.json({ error: 'Budget not found' }, { status: 404 })
    }

    if (existingBudget.userId !== user.userId) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 4. Calculate new limit
    const currentLimit = Number(existingBudget.limit)
    const newLimit = currentLimit + amount

    // 5. Update the budget with the new limit
    const [updatedBudget] = await db
      .update(budgets)
      .set({ limit: newLimit.toString() })
      .where(and(eq(budgets.id, budgetId), eq(budgets.userId, user.userId)))
      .returning()

    return Response.json(updatedBudget, { status: 200 })
  } catch (error) {
    console.error('[POST /api/budgets/add-funds]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
