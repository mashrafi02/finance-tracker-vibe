import { db } from '@/db'
import { savingsGoals, savingsEntries, accounts } from '@/db/schema'
import { getAuthUser } from '@/lib/auth'
import { updateSavingsEntrySchema } from '@/lib/validations/savings'
import { eq, sql } from 'drizzle-orm'

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
  const result = updateSavingsEntrySchema.safeParse(body)
  if (!result.success) {
    return Response.json(
      { error: 'Validation failed', details: result.error.flatten() },
      { status: 400 }
    )
  }

  try {
    // Use a transaction to ensure atomic updates
    const updated = await db.transaction(async (tx) => {
      // Get the existing entry
      const [existing] = await tx
        .select({
          id: savingsEntries.id,
          userId: savingsEntries.userId,
          savingsGoalId: savingsEntries.savingsGoalId,
          amount: savingsEntries.amount,
        })
        .from(savingsEntries)
        .where(eq(savingsEntries.id, id))
        .limit(1)

      if (!existing) {
        throw new Error('Entry not found')
      }

      if (existing.userId !== user.userId) {
        throw new Error('Forbidden')
      }

      const oldAmount = Number(existing.amount)

      // Prepare update data
      const updateData: Record<string, string | Date> = {}
      let newAmount = oldAmount

      if (result.data.amount !== undefined) {
        newAmount = result.data.amount
        updateData.amount = result.data.amount.toString()
      }
      if (result.data.date !== undefined) {
        updateData.date = new Date(result.data.date)
      }

      // Update the entry
      const [updatedEntry] = await tx
        .update(savingsEntries)
        .set(updateData)
        .where(eq(savingsEntries.id, id))
        .returning()

      // Update the goal's savedAmount if amount changed
      if (newAmount !== oldAmount) {
        const diff = newAmount - oldAmount

        // If adding more to savings (diff > 0), check the balance is sufficient
        if (diff > 0) {
          const [account] = await tx
            .select({ balance: accounts.balance })
            .from(accounts)
            .where(eq(accounts.userId, user.userId))
            .limit(1)

          if (!account || Number(account.balance) < diff) {
            throw new Error('Insufficient balance')
          }
        }

        await tx
          .update(savingsGoals)
          .set({
            savedAmount: sql`${savingsGoals.savedAmount} + ${diff}`,
          })
          .where(eq(savingsGoals.id, existing.savingsGoalId))

        // Update account balance (reverse of the diff)
        await tx
          .update(accounts)
          .set({
            balance: sql`${accounts.balance} - ${diff}`,
          })
          .where(eq(accounts.userId, user.userId))
      }

      return updatedEntry
    })

    return Response.json({ entry: updated })
  } catch (error) {
    console.error('[PUT /api/savings-entries/:id]', error)

    if (error instanceof Error) {
      if (error.message === 'Insufficient balance') {
        return Response.json({ error: 'Insufficient balance to update this savings entry.' }, { status: 402 })
      }
      if (error.message === 'Entry not found') {
        return Response.json({ error: 'Not found' }, { status: 404 })
      }
      if (error.message === 'Forbidden') {
        return Response.json({ error: 'Forbidden' }, { status: 403 })
      }
    }
    
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
    // Use a transaction to ensure atomic updates
    await db.transaction(async (tx) => {
      // Get the existing entry
      const [existing] = await tx
        .select({
          id: savingsEntries.id,
          userId: savingsEntries.userId,
          savingsGoalId: savingsEntries.savingsGoalId,
          amount: savingsEntries.amount,
        })
        .from(savingsEntries)
        .where(eq(savingsEntries.id, id))
        .limit(1)

      if (!existing) {
        throw new Error('Entry not found')
      }

      if (existing.userId !== user.userId) {
        throw new Error('Forbidden')
      }

      // Delete the entry
      await tx
        .delete(savingsEntries)
        .where(eq(savingsEntries.id, id))

      // Update the goal's savedAmount
      await tx
        .update(savingsGoals)
        .set({
          savedAmount: sql`${savingsGoals.savedAmount} - ${existing.amount}`,
        })
        .where(eq(savingsGoals.id, existing.savingsGoalId))

      // Increase account balance (money returned from savings to balance)
      await tx
        .update(accounts)
        .set({
          balance: sql`${accounts.balance} + ${existing.amount}`,
        })
        .where(eq(accounts.userId, user.userId))
    })

    return new Response(null, { status: 204 })
  } catch (error) {
    console.error('[DELETE /api/savings-entries/:id]', error)
    
    if (error instanceof Error) {
      if (error.message === 'Entry not found') {
        return Response.json({ error: 'Not found' }, { status: 404 })
      }
      if (error.message === 'Forbidden') {
        return Response.json({ error: 'Forbidden' }, { status: 403 })
      }
    }
    
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
