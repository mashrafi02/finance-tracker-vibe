import { db } from '@/db'
import { transactions, categories, accounts } from '@/db/schema'
import { getAuthUser } from '@/lib/auth'
import { updateTransactionSchema } from '@/lib/validations/transaction'
import { eq, and, sql } from 'drizzle-orm'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const [transaction] = await db
      .select({
        id: transactions.id,
        amount: transactions.amount,
        type: transactions.type,
        description: transactions.description,
        date: transactions.date,
        createdAt: transactions.createdAt,
        categoryId: transactions.categoryId,
        category: {
          id: categories.id,
          name: categories.name,
          color: categories.color,
          icon: categories.icon,
        },
      })
      .from(transactions)
      .innerJoin(categories, eq(transactions.categoryId, categories.id))
      .where(and(eq(transactions.id, id), eq(transactions.userId, user.userId)))
      .limit(1)

    if (!transaction) {
      return Response.json({ error: 'Not found' }, { status: 404 })
    }

    return Response.json(transaction)
  } catch (error) {
    console.error('[GET /api/transactions/:id]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  // Verify ownership first
  const [existing] = await db
    .select({ id: transactions.id, userId: transactions.userId })
    .from(transactions)
    .where(eq(transactions.id, id))
    .limit(1)

  if (!existing) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  if (existing.userId !== user.userId) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Parse and validate body
  const body = await req.json()
  const result = updateTransactionSchema.safeParse(body)
  if (!result.success) {
    return Response.json(
      { error: 'Validation failed', details: result.error.flatten() },
      { status: 400 }
    )
  }

  const { amount, type, description, date, categoryId, note } = result.data

  try {
    // If categoryId is being changed, verify it belongs to user
    if (categoryId) {
      const [category] = await db
        .select({ id: categories.id })
        .from(categories)
        .where(and(eq(categories.id, categoryId), eq(categories.userId, user.userId)))
        .limit(1)

      if (!category) {
        return Response.json({ error: 'Category not found' }, { status: 404 })
      }
    }

    // Build update object
    const updateData: Record<string, unknown> = {}
    if (amount !== undefined) updateData.amount = amount.toFixed(2)
    if (type !== undefined) updateData.type = type
    if (description !== undefined) {
      updateData.description = note ? `${description} | ${note}` : description
    }
    if (date !== undefined) updateData.date = new Date(date)
    if (categoryId !== undefined) updateData.categoryId = categoryId

    const [updated] = await db
      .update(transactions)
      .set(updateData)
      .where(eq(transactions.id, id))
      .returning()

    return Response.json(updated)
  } catch (error) {
    console.error('[PUT /api/transactions/:id]', error)
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

  // Use transaction to verify ownership, delete, and update account balance
  try {
    await db.transaction(async (tx) => {
      // Verify ownership and get transaction details
      const [existing] = await tx
        .select({
          id: transactions.id,
          userId: transactions.userId,
          amount: transactions.amount,
          type: transactions.type,
        })
        .from(transactions)
        .where(eq(transactions.id, id))
        .limit(1)

      if (!existing) {
        throw new Error('Not found')
      }

      if (existing.userId !== user.userId) {
        throw new Error('Forbidden')
      }

      // Delete transaction
      await tx.delete(transactions).where(eq(transactions.id, id))

      // Reverse the account balance change
      const amount = Number(existing.amount)
      const balanceChange = existing.type === 'INCOME' ? -amount : amount
      await tx
        .update(accounts)
        .set({
          balance: sql`${accounts.balance} + ${balanceChange}`,
        })
        .where(eq(accounts.userId, user.userId))
    })

    return new Response(null, { status: 204 })
  } catch (error) {
    console.error('[DELETE /api/transactions/:id]', error)
    
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
