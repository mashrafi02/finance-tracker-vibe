import { db } from '@/db'
import { savingsGoals } from '@/db/schema'
import { getAuthUser } from '@/lib/auth'
import { updateSavingsGoalSchema } from '@/lib/validations/savings'
import { and, eq } from 'drizzle-orm'

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()
  const result = updateSavingsGoalSchema.safeParse(body)
  if (!result.success) {
    return Response.json(
      { error: 'Validation failed', details: result.error.flatten() },
      { status: 400 }
    )
  }

  try {
    // Check ownership first
    const [existing] = await db
      .select({ id: savingsGoals.id, userId: savingsGoals.userId })
      .from(savingsGoals)
      .where(eq(savingsGoals.id, id))
      .limit(1)

    if (!existing) {
      return Response.json({ error: 'Not found' }, { status: 404 })
    }

    if (existing.userId !== user.userId) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Prepare update data
    const updateData: Record<string, string> = {}
    if (result.data.name !== undefined) {
      updateData.name = result.data.name
    }
    if (result.data.targetAmount !== undefined) {
      updateData.targetAmount = result.data.targetAmount.toString()
    }

    // Update the goal
    const [updated] = await db
      .update(savingsGoals)
      .set(updateData)
      .where(eq(savingsGoals.id, id))
      .returning()

    return Response.json({ goal: updated })
  } catch (error) {
    console.error('[PUT /api/savings-goals/:id]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    // Check ownership first
    const [existing] = await db
      .select({ id: savingsGoals.id, userId: savingsGoals.userId })
      .from(savingsGoals)
      .where(eq(savingsGoals.id, id))
      .limit(1)

    if (!existing) {
      return Response.json({ error: 'Not found' }, { status: 404 })
    }

    if (existing.userId !== user.userId) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete (cascade will remove all entries)
    await db
      .delete(savingsGoals)
      .where(eq(savingsGoals.id, id))

    return new Response(null, { status: 204 })
  } catch (error) {
    console.error('[DELETE /api/savings-goals/:id]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
