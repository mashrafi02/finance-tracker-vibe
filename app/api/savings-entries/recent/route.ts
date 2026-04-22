import { NextRequest } from 'next/server'
import { db } from '@/db'
import { savingsEntries, savingsGoals } from '@/db/schema'
import { getAuthUser } from '@/lib/auth'
import { eq, desc } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  // 1. Authenticate
  const user = await getAuthUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Parse and validate query params
  const { searchParams } = new URL(req.url)
  const limitParam = searchParams.get('limit')
  const limit = limitParam ? Math.min(100, Math.max(1, Number(limitParam))) : 5

  if (limitParam && isNaN(Number(limitParam))) {
    return Response.json(
      { error: 'Invalid limit parameter' },
      { status: 400 }
    )
  }

  // 3. Query recent savings entries with goal names
  try {
    const entries = await db
      .select({
        id: savingsEntries.id,
        amount: savingsEntries.amount,
        date: savingsEntries.date,
        createdAt: savingsEntries.createdAt,
        goal: {
          id: savingsGoals.id,
          name: savingsGoals.name,
        },
      })
      .from(savingsEntries)
      .innerJoin(savingsGoals, eq(savingsEntries.savingsGoalId, savingsGoals.id))
      .where(eq(savingsEntries.userId, user.userId))
      .orderBy(desc(savingsEntries.date))
      .limit(limit)

    return Response.json({ entries })
  } catch (error) {
    console.error('[GET /api/savings-entries/recent]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
