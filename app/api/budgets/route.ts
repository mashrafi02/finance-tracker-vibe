import { NextRequest } from 'next/server'
import { db } from '@/db'
import { budgets, categories, transactions } from '@/db/schema'
import { getAuthUser } from '@/lib/auth'
import { createBudgetSchema, budgetQuerySchema } from '@/lib/validations/budget'
import { eq, and, gte, lte, sum } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  // 1. Authenticate
  const user = await getAuthUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Parse and validate query params
  const { searchParams } = new URL(req.url)
  const monthParam = searchParams.get('month')

  const result = budgetQuerySchema.safeParse({ month: monthParam })
  if (!result.success) {
    return Response.json(
      { error: 'Validation failed', details: result.error.flatten() },
      { status: 400 }
    )
  }

  const { month } = result.data

  // 3. Calculate date range for the month
  const [year, m] = month.split('-').map(Number)
  const startDate = new Date(year, m - 1, 1)
  const endDate = new Date(year, m, 0, 23, 59, 59)

  try {
    // 4. Get all categories for the user
    const userCategories = await db
      .select({
        id: categories.id,
        name: categories.name,
        icon: categories.icon,
        color: categories.color,
      })
      .from(categories)
      .where(eq(categories.userId, user.userId))

    // 5. Get budgets for this month
    const userBudgets = await db
      .select({
        categoryId: budgets.categoryId,
        budgetId: budgets.id,
        limit: budgets.limit,
      })
      .from(budgets)
      .where(and(eq(budgets.userId, user.userId), eq(budgets.month, month)))

    // 6. Calculate spending per category for this month
    const spendingData = await db
      .select({
        categoryId: transactions.categoryId,
        spent: sum(transactions.amount),
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, user.userId),
          eq(transactions.type, 'EXPENSE'),
          gte(transactions.date, startDate),
          lte(transactions.date, endDate)
        )
      )
      .groupBy(transactions.categoryId)

    // 7. Combine all data
    const budgetStatus = userCategories.map((category) => {
      const budget = userBudgets.find((b) => b.categoryId === category.id)
      const spending = spendingData.find((s) => s.categoryId === category.id)

      const limit = budget ? Number(budget.limit) : null
      const spent = spending ? Number(spending.spent) : 0
      const remaining = limit !== null ? limit - spent : null
      const isOverspent = limit !== null && spent > limit

      return {
        categoryId: category.id,
        categoryName: category.name,
        categoryIcon: category.icon,
        categoryColor: category.color,
        budgetId: budget?.budgetId ?? null,
        limit,
        spent,
        remaining,
        isOverspent,
        percentageUsed: limit !== null && limit > 0 ? Math.round((spent / limit) * 100) : null,
      }
    })

    return Response.json({ budgets: budgetStatus, month })
  } catch (error) {
    console.error('[GET /api/budgets]', error)
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
  const result = createBudgetSchema.safeParse(body)
  if (!result.success) {
    return Response.json(
      { error: 'Validation failed', details: result.error.flatten() },
      { status: 400 }
    )
  }

  const { categoryId, limit, month } = result.data

  try {
    // 3. Verify category exists and belongs to user
    const [category] = await db
      .select({ id: categories.id, userId: categories.userId })
      .from(categories)
      .where(eq(categories.id, categoryId))
      .limit(1)

    if (!category) {
      return Response.json({ error: 'Category not found' }, { status: 404 })
    }

    if (category.userId !== user.userId) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 4. Upsert budget — insert or update if exists
    const [budget] = await db
      .insert(budgets)
      .values({
        userId: user.userId,
        categoryId,
        limit: limit.toString(),
        month,
      })
      .onConflictDoUpdate({
        target: [budgets.userId, budgets.categoryId, budgets.month],
        set: { limit: limit.toString() },
      })
      .returning()

    return Response.json(budget, { status: 201 })
  } catch (error) {
    console.error('[POST /api/budgets]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
