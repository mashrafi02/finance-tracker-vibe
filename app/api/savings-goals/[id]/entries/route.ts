import { db } from '@/db'
import { savingsGoals, savingsEntries, accounts } from '@/db/schema'
import { getAuthUser } from '@/lib/auth'
import { createSavingsEntrySchema } from '@/lib/validations/savings'
import { and, eq, desc, sql } from 'drizzle-orm'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: goalId } = await params

  try {
    // Verify the goal exists and belongs to the user
    const [goal] = await db
      .select({ id: savingsGoals.id })
      .from(savingsGoals)
      .where(
        and(
          eq(savingsGoals.id, goalId),
          eq(savingsGoals.userId, user.userId)
        )
      )
      .limit(1)

    if (!goal) {
      return Response.json({ error: 'Goal not found' }, { status: 404 })
    }

    // Get all entries for this goal
    const entries = await db
      .select()
      .from(savingsEntries)
      .where(
        and(
          eq(savingsEntries.savingsGoalId, goalId),
          eq(savingsEntries.userId, user.userId)
        )
      )
      .orderBy(desc(savingsEntries.date))

    return Response.json({ entries })
  } catch (error) {
    console.error('[GET /api/savings-goals/:goalId/entries]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: goalId } = await params
  const body = await req.json()
  const result = createSavingsEntrySchema.safeParse(body)
  if (!result.success) {
    return Response.json(
      { error: 'Validation failed', details: result.error.flatten() },
      { status: 400 }
    )
  }

  try {
    // Use a transaction to ensure atomic updates
    const entry = await db.transaction(async (tx) => {
      // Verify the goal exists and belongs to the user
      const [goal] = await tx
        .select({ id: savingsGoals.id })
        .from(savingsGoals)
        .where(
          and(
            eq(savingsGoals.id, goalId),
            eq(savingsGoals.userId, user.userId)
          )
        )
        .limit(1)

      if (!goal) {
        throw new Error('Goal not found')
      }

      // Insert the entry
      const [newEntry] = await tx
        .insert(savingsEntries)
        .values({
          userId: user.userId,
          savingsGoalId: goalId,
          amount: result.data.amount.toString(),
          date: new Date(result.data.date),
        })
        .returning()

      // Update the goal's savedAmount
      await tx
        .update(savingsGoals)
        .set({
          savedAmount: sql`${savingsGoals.savedAmount} + ${result.data.amount}`,
        })
        .where(eq(savingsGoals.id, goalId))

      // Decrease account balance (money moved from balance to savings)
      await tx
        .update(accounts)
        .set({
          balance: sql`${accounts.balance} - ${result.data.amount}`,
        })
        .where(eq(accounts.userId, user.userId))

      return newEntry
    })

    return Response.json({ entry }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/savings-goals/:goalId/entries]', error)
    
    if (error instanceof Error && error.message === 'Goal not found') {
      return Response.json({ error: 'Goal not found' }, { status: 404 })
    }
    
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
