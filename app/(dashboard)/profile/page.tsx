import { ProfilePageClient } from '@/components/profile/profile-page-client'
import { getAuthUser } from '@/lib/auth'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'

export default async function ProfilePage() {
  const authUser = await getAuthUser()
  if (!authUser) redirect('/login')

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

  if (!user) redirect('/login')

  return <ProfilePageClient initialUser={user} />
}


