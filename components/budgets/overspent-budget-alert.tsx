'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'
import { useOverspentCategories } from '@/hooks/use-budgets'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'

export function OverspentBudgetAlert() {
  const { overspentCategories, isLoading, hasOverspent } = useOverspentCategories()

  if (isLoading || !hasOverspent) {
    return null
  }

  return (
    <Card className="border-destructive/25 bg-destructive/8 shadow-none">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/12 text-destructive">
            <AlertTriangle className="h-4 w-4" />
          </span>
          <CardTitle className="text-destructive">Budget Alert</CardTitle>
        </div>
        <CardDescription>
          You have exceeded your budget in {overspentCategories.length} {
            overspentCategories.length === 1 ? 'category' : 'categories'
          }.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          {overspentCategories.slice(0, 3).map((category) => (
            <div key={category.categoryId} className="flex items-center justify-between rounded-xl border border-destructive/15 bg-background/40 px-3 py-2">
              <div className="flex items-center gap-2">
                <span>{category.categoryIcon}</span>
                <span className="text-sm font-semibold tracking-tight">{category.categoryName}</span>
              </div>
              <div className="text-sm font-semibold text-destructive">
                {formatCurrency(Math.abs(category.remaining || 0))} over
              </div>
            </div>
          ))}
          {overspentCategories.length > 3 && (
            <p className="text-xs text-muted-foreground">
              +{overspentCategories.length - 3} more categories
            </p>
          )}
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/profile">
            Manage Budgets
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}