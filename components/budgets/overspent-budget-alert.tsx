'use client'

import { Button } from '@/components/ui/button'
import { AlertTriangle, ArrowRight } from 'lucide-react'
import { useOverspentCategories } from '@/hooks/use-budgets'
import { useCurrency } from '@/contexts/currency-context'
import Link from 'next/link'

export function OverspentBudgetAlert() {
  const { formatCurrency } = useCurrency()
  const { overspentCategories, isLoading, hasOverspent } = useOverspentCategories()

  if (isLoading || !hasOverspent) {
    return null
  }

  const count = overspentCategories.length

  return (
    <div className="rounded-2xl border border-rose-200/70 bg-rose-50/70 p-4 dark:border-rose-500/25 dark:bg-rose-500/10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300">
            <AlertTriangle className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold tracking-tight text-rose-900 dark:text-rose-200">
              Budget alert
            </p>
            <p className="mt-0.5 text-xs font-medium text-rose-700/80 dark:text-rose-200/70">
              You&apos;ve exceeded your limit in {count} {count === 1 ? 'category' : 'categories'}.
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" asChild className="gap-1 border-rose-200 bg-white text-rose-700 hover:bg-rose-50 dark:border-rose-500/30 dark:bg-transparent dark:text-rose-300 dark:hover:bg-rose-500/10">
          <Link href="/transactions">
            Manage
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {overspentCategories.slice(0, 4).map((c) => (
          <span
            key={c.categoryId}
            className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-rose-700 shadow-card dark:bg-rose-500/15 dark:text-rose-200"
          >
            <span>{c.categoryIcon}</span>
            <span>{c.categoryName}</span>
            <span className="font-mono tabular-nums text-rose-600 dark:text-rose-300">
              {formatCurrency(Math.abs(c.remaining || 0))} over
            </span>
          </span>
        ))}
        {count > 4 && (
          <span className="inline-flex items-center rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-rose-700 shadow-card dark:bg-rose-500/15 dark:text-rose-200">
            +{count - 4} more
          </span>
        )}
      </div>
    </div>
  )
}