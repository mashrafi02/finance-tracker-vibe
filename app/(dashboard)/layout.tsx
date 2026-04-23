import { getAuthUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { users } from '@/db/schema'
import { Header } from '@/components/layout/header'
import { SidebarNav } from '@/components/layout/sidebar-nav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getAuthUser()

  if (!user) {
    redirect('/login')
  }

  const [userRow] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, user.userId))
    .limit(1)

  const emailPrefix = user.email.split('@')[0] ?? ''
  const displayName =
    userRow?.name?.trim() ||
    emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1)

  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        <SidebarNav />
        <div className="flex min-w-0 flex-1 flex-col">
          <Header user={{ email: user.email, name: displayName }} />
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <div className="mx-auto w-full max-w-[1400px]">{children}</div>
          </main>
        </div>
      </div>
    </div>
  )
}
