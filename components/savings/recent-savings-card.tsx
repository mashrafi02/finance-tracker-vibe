'use client'

import Link from 'next/link'
import { ArrowRight, Sprout } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { useRecentSavings } from '@/hooks/use-recent-savings'
import { formatCurrency, formatDate } from '@/lib/utils'

interface RecentSavingsCardProps {
  limit?: number
  showSeeAll?: boolean
}

export function RecentSavingsCard({
  limit = 8,
  showSeeAll = false,
}: RecentSavingsCardProps) {
  const { entries, isLoading, isError } = useRecentSavings(limit)

  return (
    <Card className="h-full w-full min-w-0 overflow-hidden">
      <CardContent className="flex h-full min-w-0 flex-col p-5">
        <div className="mb-4 flex items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold">Recent savings</h3>
            <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">
              Your latest contributions
            </p>
          </div>
          {showSeeAll && (
            <Button variant="ghost" size="sm" asChild className="h-7 px-2 text-xs">
              <Link href="/savings" className="gap-1">
                See all <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto -mx-1 px-1">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-2.5 w-16" />
                  </div>
                  <Skeleton className="h-3 w-16" />
                </div>
              ))}
            </div>
          ) : isError ? (
            <p className="py-6 text-center text-xs text-muted-foreground">
              Failed to load recent savings.
            </p>
          ) : entries.length === 0 ? (
            <EmptyState
              icon={<Sprout />}
              title="No contributions yet"
              description="Add funds to a goal to start tracking your progress."
              className="py-8"
            />
          ) : (
            <ul className="min-w-0 divide-y divide-border/60">
              {entries.map((entry) => (
                <li
                  key={entry.id}
                  className="flex min-w-0 items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                >
                  <span
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-300"
                    aria-hidden
                  >
                    <Sprout className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold tracking-tight">
                      {entry.goal.name}
                    </p>
                    <p className="truncate text-[11px] font-medium text-muted-foreground">
                      {formatDate(entry.date)}
                    </p>
                  </div>
                  <span className="shrink-0 max-w-[45%] truncate font-mono text-[13px] font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                    +{formatCurrency(Number(entry.amount))}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
