'use client'

import { UpdateNameForm } from '@/components/profile/update-name-form'
import { ChangePasswordForm } from '@/components/profile/change-password-form'
import { DeleteAccountSection } from '@/components/profile/delete-account-section'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import useSWR from 'swr'
import { fetcher } from '@/lib/utils'

interface AuthUser {
  userId: string
  email: string
  username: string
  name: string
}

export default function ProfilePage() {
  const { data: user, isLoading: userLoading } = useSWR<AuthUser>('/api/auth/me', fetcher)

  if (userLoading) {
    return <ProfilePageSkeleton />
  }

  // The dashboard layout already handles authentication, so we don't need to redirect here
  if (!user) {
    return <ProfilePageSkeleton />
  }

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-2xl font-semibold tracking-tight sm:text-[28px]">Profile</h2>
        <p className="mt-1 text-sm font-medium text-muted-foreground">
          Manage your account settings.
        </p>
      </section>

      <Separator className="opacity-50" />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
          <CardDescription className="text-xs">Your account information.</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border/70 bg-muted/30 px-4 py-3">
              <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Email</dt>
              <dd className="mt-1 text-sm font-semibold tracking-tight">{user.email}</dd>
            </div>
            <div className="rounded-xl border border-border/70 bg-muted/30 px-4 py-3">
              <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Username</dt>
              <dd className="mt-1 text-sm font-semibold tracking-tight">{user.username}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <UpdateNameForm initialName={user.name} />
        <ChangePasswordForm />
      </div>

      <Separator className="opacity-50" />

      <DeleteAccountSection />
    </div>
  )
}

function ProfilePageSkeleton() {
  return (
    <div className="space-y-7">
      <Skeleton className="h-24 rounded-3xl" />
      <Skeleton className="h-32 rounded-xl" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-56 rounded-xl" />
        <Skeleton className="h-56 rounded-xl" />
      </div>
      <Skeleton className="h-72 rounded-xl" />
    </div>
  )
}

