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
        type: budgets.type,
      })
      .from(budgets)
      .where(and(eq(budgets.userId, user.userId), eq(budgets.month, month)))

    // 6. Calculate expense and income totals per category for this month
    const expenseData = await db
      .select({
        categoryId: transactions.categoryId,
        total: sum(transactions.amount),
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

    const incomeData = await db
      .select({
        categoryId: transactions.categoryId,
        total: sum(transactions.amount),
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, user.userId),
          eq(transactions.type, 'INCOME'),
          gte(transactions.date, startDate),
          lte(transactions.date, endDate)
        )
      )
      .groupBy(transactions.categoryId)

    // 7. Combine — build SPENDING and INCOME_GOAL rows for every category
    const spendingBudgets = userCategories.map((category) => {
      const budget = userBudgets.find(
        (b) => b.categoryId === category.id && b.type === 'SPENDING',
      )
      const spent = Number(
        expenseData.find((s) => s.categoryId === category.id)?.total ?? 0,
      )

      const limit = budget ? Number(budget.limit) : null
      const remaining = limit !== null ? limit - spent : null
      const isOverspent = limit !== null && spent > limit

      return {
        categoryId: category.id,
        categoryName: category.name,
        categoryIcon: category.icon,
        categoryColor: category.color,
        budgetId: budget?.budgetId ?? null,
        type: 'SPENDING' as const,
        limit,
        spent,
        remaining,
        isOverspent,
        percentageUsed:
          limit !== null && limit > 0 ? Math.round((spent / limit) * 100) : null,
      }
    })

    const incomeGoals = userCategories.map((category) => {
      const budget = userBudgets.find(
        (b) => b.categoryId === category.id && b.type === 'INCOME_GOAL',
      )
      const earned = Number(
        incomeData.find((s) => s.categoryId === category.id)?.total ?? 0,
      )

      const goal = budget ? Number(budget.limit) : null
      const remaining = goal !== null ? Math.max(0, goal - earned) : null
      const isComplete = goal !== null && earned >= goal

      return {
        categoryId: category.id,
        categoryName: category.name,
        categoryIcon: category.icon,
        categoryColor: category.color,
        budgetId: budget?.budgetId ?? null,
        type: 'INCOME_GOAL' as const,
        limit: goal,
        spent: earned, // reuse "spent" field name to mean "progress toward goal"
        remaining,
        isOverspent: false,
        isComplete,
        percentageUsed:
          goal !== null && goal > 0 ? Math.round((earned / goal) * 100) : null,
      }
    })

    // Keep legacy "budgets" key for existing callers (points to spendingBudgets)
    return Response.json({
      budgets: spendingBudgets,
      spendingBudgets,
      incomeGoals,
      month,
    })
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

  const { categoryId, limit, month, type } = result.data

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

    // 4. Upsert budget — insert or update if exists (scoped by type)
    const [budget] = await db
      .insert(budgets)
      .values({
        userId: user.userId,
        categoryId,
        limit: limit.toString(),
        month,
        type,
      })
      .onConflictDoUpdate({
        target: [budgets.userId, budgets.categoryId, budgets.month, budgets.type],
        set: { limit: limit.toString() },
      })
      .returning()

    return Response.json(budget, { status: 201 })
  } catch (error) {
    console.error('[POST /api/budgets]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
