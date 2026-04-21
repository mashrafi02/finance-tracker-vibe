'use client'

import { CategoriesTable } from '@/components/categories/categories-table'
import { BudgetList } from '@/components/budgets/budget-list'
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

interface Category {
  id: string
  name: string
  color: string
  icon: string
  userId: string
}

export default function ProfilePage() {
  const { data: user, isLoading: userLoading } = useSWR<AuthUser>('/api/auth/me', fetcher)
  const { data: categories = [], isLoading: categoriesLoading } = useSWR<Category[]>(
    user ? '/api/categories' : null,
    fetcher
  )

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
              Manage your account settings, categories, and budgets.
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
          </dl>
        </CardContent>
      </Card>

      <div>
        <BudgetList />
      </div>

      <Separator className="opacity-50" />

      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
          <CardDescription>
            Manage the categories you use to organize your transactions. You can create
            custom categories or edit the default ones.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {categoriesLoading ? (
            <CategoriesTableSkeleton />
          ) : (
            <CategoriesTable initialData={categories} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function ProfilePageSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-2 h-4 w-96" />
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-64" />
        </CardContent>
      </Card>
    </div>
  )
}

function CategoriesTableSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  )
}
