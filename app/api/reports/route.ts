import { db } from '@/db'
import { monthlyReports } from '@/db/schema'
import { getAuthUser } from '@/lib/auth'
import { eq, desc } from 'drizzle-orm'

export async function GET() {
  // 1. Authenticate
  const user = await getAuthUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 2. Fetch all reports for the user, ordered by month descending
    const reports = await db
      .select({
        id: monthlyReports.id,
        month: monthlyReports.month,
        generatedAt: monthlyReports.generatedAt,
      })
      .from(monthlyReports)
      .where(eq(monthlyReports.userId, user.userId))
      .orderBy(desc(monthlyReports.month))

    return Response.json({ reports })
  } catch (error) {
    console.error('[GET /api/reports]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
