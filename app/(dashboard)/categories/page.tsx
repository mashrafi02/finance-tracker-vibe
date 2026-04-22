'use client'

import useSWR from 'swr'
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
    <div className="space-y-6">
      <Reveal as="section">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-[28px]">Categories</h2>
        <p className="mt-1 text-sm font-medium text-muted-foreground">
          Organize your transactions with custom categories.
        </p>
      </Reveal>

      <Reveal delay={60}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your categories</CardTitle>
            <CardDescription className="text-xs">
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
