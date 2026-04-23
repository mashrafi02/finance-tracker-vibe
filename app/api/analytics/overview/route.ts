import { NextRequest } from 'next/server'
import { db } from '@/db'
import { transactions, savingsEntries, budgets } from '@/db/schema'
import { getAuthUser } from '@/lib/auth'
import { overviewAnalyticsQuerySchema } from '@/lib/validations/analytics'
import { eq, and, gte, lte, sql, inArray } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  // 1. Authenticate
  const user = await getAuthUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Parse and validate query params
  const { searchParams } = new URL(req.url)
  const queryResult = overviewAnalyticsQuerySchema.safeParse({
    range: searchParams.get('range') ?? undefined,
  })

  if (!queryResult.success) {
    return Response.json(
      { error: 'Invalid query parameters', details: queryResult.error.flatten() },
      { status: 400 }
    )
  }

  const { range } = queryResult.data

  // 3. Calculate date range based on range parameter
  const now = new Date()
  let startDate: Date

  if (range === 'all') {
    // Start from the earliest transaction/savings entry for this user
    // We'll use a date far in the past (10 years ago) as a practical "all time" filter
    startDate = new Date(now.getFullYear() - 10, 0, 1)
  } else {
    const days = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 365
    startDate = new Date(now)
    startDate.setDate(now.getDate() - days)
    startDate.setHours(0, 0, 0, 0)
  }

  try {
    // 4. Query stats (income, expense, net cash flow)
    const statsRows = await db
      .select({
        totalIncome: sql<string>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'INCOME' THEN ${transactions.amount} ELSE 0 END), 0)`,
        totalExpense: sql<string>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'EXPENSE' THEN ${transactions.amount} ELSE 0 END), 0)`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, user.userId),
          gte(transactions.date, startDate)
        )
      )

    const statsRow = statsRows[0]
    const totalIncome = Number(statsRow?.totalIncome ?? 0)
    const totalExpense = Number(statsRow?.totalExpense ?? 0)
    const netCashFlow = totalIncome - totalExpense
    const savingsRate = totalIncome > 0 ? Math.round((netCashFlow / totalIncome) * 100) : 0

    // 5. Query savings growth (cumulative savings over time)
    // We'll group by date and then calculate cumulative sum in memory
    const savingsRows = await db
      .select({
        date: sql<string>`DATE(${savingsEntries.date})`,
        amount: sql<string>`SUM(${savingsEntries.amount})`,
      })
      .from(savingsEntries)
      .where(
        and(
          eq(savingsEntries.userId, user.userId),
          gte(savingsEntries.date, startDate)
        )
      )
      .groupBy(sql`DATE(${savingsEntries.date})`)
      .orderBy(sql`DATE(${savingsEntries.date})`)

    // Calculate cumulative sum
    let cumulativeSavings = 0
    const savingsGrowth = savingsRows.map((row) => {
      cumulativeSavings += Number(row.amount)
      return {
        date: row.date,
        cumulativeSavings: Math.round(cumulativeSavings * 100) / 100, // Round to 2 decimals
      }
    })

    // 6. Query budget performance for current month
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    // Get all spending budgets for current month
    const budgetTotalsRows = await db
      .select({
        totalBudget: sql<string>`COALESCE(SUM(${budgets.limit}), 0)`,
      })
      .from(budgets)
      .where(
        and(
          eq(budgets.userId, user.userId),
          eq(budgets.month, currentMonth),
          eq(budgets.type, 'SPENDING')
        )
      )

    const budgetTotals = budgetTotalsRows[0]

    // Get total spent in budgeted categories for current month
    const budgetedCategoryIds = await db
      .select({ categoryId: budgets.categoryId })
      .from(budgets)
      .where(
        and(
          eq(budgets.userId, user.userId),
          eq(budgets.month, currentMonth),
          eq(budgets.type, 'SPENDING')
        )
      )

    let totalSpent = 0
    if (budgetedCategoryIds.length > 0) {
      const categoryIds = budgetedCategoryIds.map((b) => b.categoryId)
      const spentTotalsRows = await db
        .select({
          totalSpent: sql<string>`COALESCE(SUM(${transactions.amount}), 0)`,
        })
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, user.userId),
            eq(transactions.type, 'EXPENSE'),
            gte(transactions.date, monthStart),
            lte(transactions.date, monthEnd),
            inArray(transactions.categoryId, categoryIds)
          )
        )
      const spentTotals = spentTotalsRows[0]
      totalSpent = Number(spentTotals?.totalSpent ?? 0)
    }

    const totalBudget = Number(budgetTotals?.totalBudget ?? 0)
    const percentageUsed = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0

    // 7. Return consolidated response
    return Response.json({
      stats: {
        totalIncome: Math.round(totalIncome * 100) / 100,
        totalExpense: Math.round(totalExpense * 100) / 100,
        netCashFlow: Math.round(netCashFlow * 100) / 100,
        savingsRate,
      },
      savingsGrowth,
      budgetPerformance: {
        totalBudget: Math.round(totalBudget * 100) / 100,
        totalSpent: Math.round(totalSpent * 100) / 100,
        percentageUsed,
      },
    })
  } catch (error) {
    console.error('[GET /api/analytics/overview]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
