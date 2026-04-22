import { db } from '@/db'
import { monthlyReports } from '@/db/schema'
import { getAuthUser } from '@/lib/auth'
import { eq, and } from 'drizzle-orm'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  // 1. Authenticate
  const user = await getAuthUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    // 2. Fetch the report with ownership check
    const [report] = await db
      .select()
      .from(monthlyReports)
      .where(
        and(
          eq(monthlyReports.id, id),
          eq(monthlyReports.userId, user.userId),
        ),
      )
      .limit(1)

    if (!report) {
      return Response.json({ error: 'Report not found' }, { status: 404 })
    }

    return Response.json(report)
  } catch (error) {
    console.error('[GET /api/reports/:id]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  // 1. Authenticate
  const user = await getAuthUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    // 2. Fetch first to verify ownership
    const [existing] = await db
      .select({ id: monthlyReports.id, userId: monthlyReports.userId })
      .from(monthlyReports)
      .where(eq(monthlyReports.id, id))
      .limit(1)

    if (!existing) {
      return Response.json({ error: 'Report not found' }, { status: 404 })
    }

    if (existing.userId !== user.userId) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 3. Delete the report
    await db.delete(monthlyReports).where(eq(monthlyReports.id, id))

    return new Response(null, { status: 204 })
  } catch (error) {
    console.error('[DELETE /api/reports/:id]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
