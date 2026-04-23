import { getAuthUser } from '@/lib/auth'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET() {
  // Get the authenticated user from JWT
  const authUser = await getAuthUser()
  
  if (!authUser) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Fetch full user data from database
    const [user] = await db
      .select({
        userId: users.id,
        email: users.email,
        username: users.username,
        name: users.name,
        imageUrl: users.imageUrl,
        bio: users.bio,
      })
      .from(users)
      .where(eq(users.id, authUser.userId))
      .limit(1)

    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }

    return Response.json(user, {
      headers: {
        'Cache-Control': 'private, max-age=30, stale-while-revalidate=300',
      },
    })
  } catch (error) {
    console.error('[GET /api/auth/me]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}