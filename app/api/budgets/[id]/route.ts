import { db } from '@/db'
import { budgets, accounts } from '@/db/schema'
import { getAuthUser } from '@/lib/auth'
import { eq, and, sql } from 'drizzle-orm'

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

  // 2. Use transaction to fetch, verify, delete budget and update account balance
  try {
    await db.transaction(async (tx) => {
      // Fetch budget to verify ownership and get limit
      const [existing] = await tx
        .select({
          id: budgets.id,
          userId: budgets.userId,
          limit: budgets.limit,
          type: budgets.type,
        })
        .from(budgets)
        .where(eq(budgets.id, id))
        .limit(1)

      if (!existing) {
        throw new Error('Not found')
      }

      // Return 403 not 404 — do not reveal the record exists if it belongs to another user
      if (existing.userId !== user.userId) {
        throw new Error('Forbidden')
      }

      // Delete budget
      await tx
        .delete(budgets)
        .where(and(eq(budgets.id, id), eq(budgets.userId, user.userId)))

      // Update account balance by subtracting the budget limit
      // Only SPENDING budgets affect the main balance.
      if (existing.type === 'SPENDING') {
        await tx
          .update(accounts)
          .set({
            balance: sql`${accounts.balance} - ${existing.limit}`,
          })
          .where(eq(accounts.userId, user.userId))
      }
    })

    return new Response(null, { status: 204 })
  } catch (error) {
    console.error('[DELETE /api/budgets/:id]', error)
    
    if (error instanceof Error) {
      if (error.message === 'Not found') {
        return Response.json({ error: 'Not found' }, { status: 404 })
      }
      if (error.message === 'Forbidden') {
        return Response.json({ error: 'Forbidden' }, { status: 403 })
      }
    }
    
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
