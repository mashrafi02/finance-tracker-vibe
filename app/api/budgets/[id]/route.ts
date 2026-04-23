import { db } from '@/db'
import { budgets } from '@/db/schema'
import { getAuthUser } from '@/lib/auth'
import { eq, and } from 'drizzle-orm'

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1. Authenticate
  const user = await getAuthUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    // Fetch budget to verify ownership
    const [existing] = await db
      .select({ id: budgets.id, userId: budgets.userId })
      .from(budgets)
      .where(eq(budgets.id, id))
      .limit(1)

    if (!existing) {
      return Response.json({ error: 'Not found' }, { status: 404 })
    }

    // Return 403 not 404 — do not reveal the record exists if it belongs to another user
    if (existing.userId !== user.userId) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    await db
      .delete(budgets)
      .where(and(eq(budgets.id, id), eq(budgets.userId, user.userId)))

    return new Response(null, { status: 204 })
  } catch (error) {
    console.error('[DELETE /api/budgets/:id]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
