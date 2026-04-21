import { db } from '@/db'
import { categories, transactions } from '@/db/schema'
import { getAuthUser } from '@/lib/auth'
import { updateCategorySchema } from '@/lib/validations/category'
import { eq, and, count } from 'drizzle-orm'

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
    const [category] = await db
      .select()
      .from(categories)
      .where(and(eq(categories.id, id), eq(categories.userId, user.userId)))
      .limit(1)

    if (!category) {
      return Response.json({ error: 'Not found' }, { status: 404 })
    }

    return Response.json(category)
  } catch (error) {
    console.error('[GET /api/categories/:id]', error)
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

  // Verify ownership
  const [existing] = await db
    .select({ id: categories.id, userId: categories.userId })
    .from(categories)
    .where(eq(categories.id, id))
    .limit(1)

  if (!existing) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  if (existing.userId !== user.userId) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const result = updateCategorySchema.safeParse(body)
  if (!result.success) {
    return Response.json(
      { error: 'Validation failed', details: result.error.flatten() },
      { status: 400 }
    )
  }

  try {
    const [updated] = await db
      .update(categories)
      .set(result.data)
      .where(eq(categories.id, id))
      .returning()

    return Response.json(updated)
  } catch (error) {
    console.error('[PUT /api/categories/:id]', error)
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

  // Verify ownership
  const [existing] = await db
    .select({ id: categories.id, userId: categories.userId })
    .from(categories)
    .where(eq(categories.id, id))
    .limit(1)

  if (!existing) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  if (existing.userId !== user.userId) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Check if category has transactions (onDelete: 'restrict')
  const [{ transactionCount }] = await db
    .select({ transactionCount: count() })
    .from(transactions)
    .where(eq(transactions.categoryId, id))

  if (transactionCount > 0) {
    return Response.json(
      { error: 'Cannot delete category with existing transactions' },
      { status: 409 }
    )
  }

  try {
    await db.delete(categories).where(eq(categories.id, id))
    return new Response(null, { status: 204 })
  } catch (error) {
    console.error('[DELETE /api/categories/:id]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
