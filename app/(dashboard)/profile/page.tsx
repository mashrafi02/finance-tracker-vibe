'use client'

import { UpdateNameForm } from '@/components/profile/update-name-form'
import { ChangePasswordForm } from '@/components/profile/change-password-form'
import { DeleteAccountSection } from '@/components/profile/delete-account-section'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import useSWR from 'swr'
import { fetcher } from '@/lib/utils'
import { UserRound } from 'lucide-react'

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
    <div className="space-y-7">
      <section className="rounded-3xl border border-border/70 bg-card px-6 py-7 shadow-[0_12px_34px_rgba(0,0,0,0.04)] sm:px-8">
        <div className="flex items-start gap-4">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <UserRound className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Profile</h1>
            <p className="mt-1 text-sm font-medium text-muted-foreground">
              Manage your account settings.
            </p>
          </div>
        </div>
      </section>

      <Separator className="opacity-50" />

      <Card className="bg-gradient-to-b from-card to-muted/15">
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Your account information.</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border/70 bg-muted/20 px-4 py-3">
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email</dt>
              <dd className="mt-1 text-sm font-semibold tracking-tight">{user.email}</dd>
            </div>
            <div className="rounded-xl border border-border/70 bg-muted/20 px-4 py-3">
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Username</dt>
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

