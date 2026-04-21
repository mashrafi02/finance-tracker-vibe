import { NextRequest } from 'next/server'
import { db } from '@/db'
import { transactions, categories } from '@/db/schema'
import { getAuthUser } from '@/lib/auth'
import { createTransactionSchema, transactionQuerySchema } from '@/lib/validations/transaction'
import { eq, and, desc, asc, count, gte, lte, sql, inArray, ilike } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  // 1. Authenticate
  const user = await getAuthUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Parse and validate query params
  const { searchParams } = new URL(req.url)
  const queryResult = transactionQuerySchema.safeParse({
    from: searchParams.get('from') ?? undefined,
    to: searchParams.get('to') ?? undefined,
    page: searchParams.get('page') ?? 1,
    pageSize: searchParams.get('pageSize') ?? 10,
    sort: searchParams.get('sort') ?? undefined,
    type: searchParams.get('type') ?? undefined,
    categoryId: searchParams.get('categoryId') ?? undefined,
    description: searchParams.get('description') ?? undefined,
  })

  if (!queryResult.success) {
    return Response.json(
      { error: 'Invalid query parameters', details: queryResult.error.flatten() },
      { status: 400 }
    )
  }

  const { from, to, page, pageSize, sort, type, categoryId, description } = queryResult.data

  // 3. Build where clause — userId from JWT, never from request
  const conditions = [eq(transactions.userId, user.userId)]

  if (from) {
    conditions.push(gte(transactions.date, new Date(from)))
  }
  if (to) {
    // Add one day to include the entire "to" date
    const toDate = new Date(to)
    toDate.setDate(toDate.getDate() + 1)
    conditions.push(lte(transactions.date, toDate))
  }
  if (type) {
    conditions.push(eq(transactions.type, type))
  }
  if (categoryId) {
    // Handle comma-separated category IDs for multi-select filtering
    const categoryIds = categoryId.split(',').map((id) => id.trim()).filter(Boolean)
    if (categoryIds.length === 1) {
      conditions.push(eq(transactions.categoryId, categoryIds[0]))
    } else if (categoryIds.length > 1) {
      conditions.push(inArray(transactions.categoryId, categoryIds))
    }
  }
  if (description) {
    // Case-insensitive search for description text
    conditions.push(ilike(transactions.description, `%${description}%`))
  }

  const where = and(...conditions)

  // 4. Determine sort order
  let orderBy = desc(transactions.date)
  if (sort) {
    const [field, direction] = sort.split('.')
    const sortDirection = direction === 'asc' ? asc : desc
    if (field === 'date') orderBy = sortDirection(transactions.date)
    else if (field === 'amount') orderBy = sortDirection(transactions.amount)
    else if (field === 'createdAt') orderBy = sortDirection(transactions.createdAt)
  }

  // 5. Query
  try {
    const [rows, [{ total }]] = await Promise.all([
      db
        .select({
          id: transactions.id,
          amount: transactions.amount,
          type: transactions.type,
          description: transactions.description,
          date: transactions.date,
          note: sql<string | null>`${transactions.description}`.as('note'), // Placeholder, note field not in schema
          createdAt: transactions.createdAt,
          category: {
            id: categories.id,
            name: categories.name,
            color: categories.color,
            icon: categories.icon,
          },
        })
        .from(transactions)
        .innerJoin(categories, eq(transactions.categoryId, categories.id))
        .where(where)
        .orderBy(orderBy)
        .limit(pageSize)
        .offset((page - 1) * pageSize),
      db
        .select({ total: count() })
        .from(transactions)
        .where(where),
    ])

    return Response.json({
      data: rows,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    })
  } catch (error) {
    console.error('[GET /api/transactions]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  // 1. Authenticate
  const user = await getAuthUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Parse and validate body
  const body = await req.json()
  const result = createTransactionSchema.safeParse(body)
  if (!result.success) {
    return Response.json(
      { error: 'Validation failed', details: result.error.flatten() },
      { status: 400 }
    )
  }

  const { amount, type, description, date, categoryId, note } = result.data

  // 3. Verify category belongs to user
  try {
    const [category] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(and(eq(categories.id, categoryId), eq(categories.userId, user.userId)))
      .limit(1)

    if (!category) {
      return Response.json({ error: 'Category not found' }, { status: 404 })
    }

    // 4. Insert transaction
    const [created] = await db
      .insert(transactions)
      .values({
        amount: amount.toFixed(2),
        type,
        description: note ? `${description} | ${note}` : description,
        date: new Date(date),
        categoryId,
        userId: user.userId,
      })
      .returning()

    return Response.json(created, { status: 201 })
  } catch (error) {
    console.error('[POST /api/transactions]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
