import { NextRequest } from 'next/server'
import { db } from '@/db'
import { transactions, categories } from '@/db/schema'
import { getAuthUser } from '@/lib/auth'
import { spendingAnalyticsQuerySchema } from '@/lib/validations/analytics'
import { eq, and, gte, sql, desc } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  // 1. Authenticate
  const user = await getAuthUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Parse and validate query params
  const { searchParams } = new URL(req.url)
  const queryResult = spendingAnalyticsQuerySchema.safeParse({
    range: searchParams.get('range') ?? undefined,
  })

  if (!queryResult.success) {
    return Response.json(
      { error: 'Invalid query parameters', details: queryResult.error.flatten() },
      { status: 400 }
    )
  }

  const { range } = queryResult.data

  // 3. Calculate date range
  const now = new Date()
  let startDate: Date

  switch (range) {
    case 'weekly':
      // Last 7 days
      startDate = new Date(now)
      startDate.setDate(now.getDate() - 6)
      startDate.setHours(0, 0, 0, 0)
      break
    case 'monthly':
      // Last 30 days
      startDate = new Date(now)
      startDate.setDate(now.getDate() - 29)
      startDate.setHours(0, 0, 0, 0)
      break
  }

  try {
    // 4. Query aggregated spending data by category
    const rows = await db
      .select({
        name: categories.name,
        color: categories.color,
        value: sql<string>`SUM(${transactions.amount})`.mapWith(Number),
      })
      .from(transactions)
      .innerJoin(categories, eq(transactions.categoryId, categories.id))
      .where(
        and(
          eq(transactions.userId, user.userId),
          eq(transactions.type, 'EXPENSE'),
          gte(transactions.date, startDate)
        )
      )
      .groupBy(categories.id, categories.name, categories.color)
      .orderBy(desc(sql`SUM(${transactions.amount})`))

    return Response.json({
      range,
      data: rows,
    })
  } catch (error) {
    console.error('[GET /api/analytics/spending]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
