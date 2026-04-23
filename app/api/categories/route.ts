import { db } from '@/db'
import { categories } from '@/db/schema'
import { getAuthUser } from '@/lib/auth'
import { createCategorySchema } from '@/lib/validations/category'
import { eq } from 'drizzle-orm'

export async function GET() {
  const user = await getAuthUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const rows = await db
      .select()
      .from(categories)
      .where(eq(categories.userId, user.userId))
      .orderBy(categories.name)

    // Categories change rarely. SWR will force a fresh fetch after mutations
    // via mutate(); this header just lets repeat navigations skip the DB.
    return Response.json(rows, {
      headers: {
        'Cache-Control': 'private, max-age=30, stale-while-revalidate=300',
      },
    })
  } catch (error) {
    console.error('[GET /api/categories]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const user = await getAuthUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const result = createCategorySchema.safeParse(body)
  if (!result.success) {
    return Response.json(
      { error: 'Validation failed', details: result.error.flatten() },
      { status: 400 }
    )
  }

  try {
    const [created] = await db
      .insert(categories)
      .values({ ...result.data, userId: user.userId })
      .returning()

    return Response.json(created, { status: 201 })
  } catch (error) {
    console.error('[POST /api/categories]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
