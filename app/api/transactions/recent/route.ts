import { NextRequest } from 'next/server'
import { db } from '@/db'
import { transactions, categories } from '@/db/schema'
import { getAuthUser } from '@/lib/auth'
import { eq, desc } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  // 1. Authenticate
  const user = await getAuthUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Parse query params
  const { searchParams } = new URL(req.url)
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? 5)))

  // 3. Query recent transactions with category data
  try {
    const rows = await db
      .select({
        id: transactions.id,
        amount: transactions.amount,
        type: transactions.type,
        description: transactions.description,
        date: transactions.date,
        createdAt: transactions.createdAt,
        category: {
          id: categories.id,
          name: categories.name,
          color: categories.color,
          icon: categories.icon,
        },
      })
      .from(transactions)
      .innerJoin(categories, eq(transactions.categoryId, categories.id))
      .where(eq(transactions.userId, user.userId))
      .orderBy(desc(transactions.date), desc(transactions.createdAt))
      .limit(limit)

    return Response.json({ transactions: rows })
  } catch (error) {
    console.error('[GET /api/transactions/recent]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
