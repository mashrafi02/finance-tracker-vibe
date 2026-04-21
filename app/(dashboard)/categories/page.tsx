'use client'

import useSWR from 'swr'
import { Tags } from 'lucide-react'
import { CategoriesTable } from '@/components/categories/categories-table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Reveal } from '@/components/ui/reveal'
import { fetcher } from '@/lib/utils'

interface Category {
  id: string
  name: string
  color: string
  icon: string
  userId: string
}

export default function CategoriesPage() {
  const { data: categories = [], isLoading } = useSWR<Category[]>('/api/categories', fetcher)

  return (
    <div className="space-y-7">
      <Reveal
        as="section"
        className="rounded-3xl border border-border/70 bg-card px-6 py-7 shadow-[0_12px_34px_rgba(0,0,0,0.04)] sm:px-8"
      >
        <div className="flex items-start gap-4">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <Tags className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Categories</h1>
            <p className="mt-1 text-sm font-medium text-muted-foreground">
              Organize your transactions with custom categories.
            </p>
          </div>
        </div>
      </Reveal>

      <Reveal delay={80}>
        <Card>
          <CardHeader>
            <CardTitle>Your categories</CardTitle>
            <CardDescription>
              Create custom categories or edit the default ones to tailor your tracking.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 rounded-lg" />
                <Skeleton className="h-10 rounded-lg" />
                <Skeleton className="h-10 rounded-lg" />
              </div>
            ) : (
              <CategoriesTable initialData={categories} />
            )}
          </CardContent>
        </Card>
      </Reveal>
    </div>
  )
}
