import { db } from '@/db'
import { savingsGoals } from '@/db/schema'
import { getAuthUser } from '@/lib/auth'
import { eq, sum } from 'drizzle-orm'

export async function GET() {
  // 1. Authenticate
  const user = await getAuthUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Query total savings
  try {
    const [result] = await db
      .select({ total: sum(savingsGoals.savedAmount) })
      .from(savingsGoals)
      .where(eq(savingsGoals.userId, user.userId))

    const totalSavings = Number(result?.total ?? 0)

    return Response.json({ totalSavings })
  } catch (error) {
    console.error('[GET /api/analytics/total-savings]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
