import { NextRequest } from 'next/server'
import { db } from '@/db'
import { transactions } from '@/db/schema'
import { getAuthUser } from '@/lib/auth'
import { summaryQuerySchema } from '@/lib/validations/summary'
import { eq, and, gte, sql } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  // 1. Authenticate
  const user = await getAuthUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Parse and validate query params
  const { searchParams } = new URL(req.url)
  const queryResult = summaryQuerySchema.safeParse({
    range: searchParams.get('range') ?? undefined,
  })

  if (!queryResult.success) {
    return Response.json(
      { error: 'Invalid query parameters', details: queryResult.error.flatten() },
      { status: 400 }
    )
  }

  const { range } = queryResult.data

  // 3. Calculate date range and truncation unit based on range parameter
  const now = new Date()
  let startDate: Date
  let truncUnit: 'day' | 'month'

  switch (range) {
    case 'weekly':
      // Last 7 days
      startDate = new Date(now)
      startDate.setDate(now.getDate() - 6)
      startDate.setHours(0, 0, 0, 0)
      truncUnit = 'day'
      break
    case 'monthly':
      // Last 30 days
      startDate = new Date(now)
      startDate.setDate(now.getDate() - 29)
      startDate.setHours(0, 0, 0, 0)
      truncUnit = 'day'
      break
    case 'yearly':
      // Last 12 months
      startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1)
      truncUnit = 'month'
      break
  }

  try {
    // 4. Query aggregated data grouped by period
    // Use literal strings for the truncation unit since DATE_TRUNC requires a literal string
    const truncSql = truncUnit === 'day' 
      ? sql<string>`DATE_TRUNC('day', ${transactions.date})::date`
      : sql<string>`DATE_TRUNC('month', ${transactions.date})::date`

    const rows = await db
      .select({
        period: truncSql.as('period'),
        income: sql<string>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'INCOME' THEN ${transactions.amount} ELSE 0 END), 0)`.as('income'),
        expense: sql<string>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'EXPENSE' THEN ${transactions.amount} ELSE 0 END), 0)`.as('expense'),
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, user.userId),
          gte(transactions.date, startDate)
        )
      )
      .groupBy(truncSql)
      .orderBy(truncSql)

    // 5. Fill in missing periods with zero values
    const filledData = fillMissingPeriods(rows, startDate, now, range)

    return Response.json({
      range,
      data: filledData,
    })
  } catch (error) {
    console.error('[GET /api/summary]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Fill in missing time periods with zero values to ensure the chart
 * has continuous data points.
 */
function fillMissingPeriods(
  rows: { period: string; income: string; expense: string }[],
  startDate: Date,
  endDate: Date,
  range: 'weekly' | 'monthly' | 'yearly'
): { period: string; income: number; expense: number }[] {
  const result: { period: string; income: number; expense: number }[] = []

  // Create a map of existing data for quick lookup
  const dataMap = new Map<string, { income: number; expense: number }>()
  for (const row of rows) {
    // Normalize the date to YYYY-MM-DD format
    const dateKey = new Date(row.period).toISOString().split('T')[0]
    dataMap.set(dateKey, {
      income: Number(row.income),
      expense: Number(row.expense),
    })
  }

  // Generate all periods in the range
  if (range === 'yearly') {
    // Generate 12 months
    for (let i = 0; i < 12; i++) {
      const periodDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1)
      const dateKey = periodDate.toISOString().split('T')[0]
      const existing = dataMap.get(dateKey)

      result.push({
        period: dateKey,
        income: existing?.income ?? 0,
        expense: existing?.expense ?? 0,
      })
    }
  } else {
    // Weekly or monthly - generate days
    const days = range === 'weekly' ? 7 : 30
    for (let i = 0; i < days; i++) {
      const periodDate = new Date(startDate)
      periodDate.setDate(startDate.getDate() + i)
      const dateKey = periodDate.toISOString().split('T')[0]
      const existing = dataMap.get(dateKey)

      result.push({
        period: dateKey,
        income: existing?.income ?? 0,
        expense: existing?.expense ?? 0,
      })
    }
  }

  return result
}
