'use client'

import Link from 'next/link'
import { ArrowRight, ReceiptText } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { useRecentTransactions } from '@/hooks/use-recent-transactions'
import { formatCurrency, formatDate, cn } from '@/lib/utils'

export function RecentActivityCard() {
  const { transactions, isLoading, isError } = useRecentTransactions(5)

  return (
    <Card className="h-full w-full min-w-0 overflow-hidden">
      <CardContent className="flex h-full min-w-0 flex-col p-5">
        <div className="mb-4 flex items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold">Recent transactions</h3>
            <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">
              Your latest entries
            </p>
          </div>
          <Button variant="ghost" size="sm" asChild className="h-7 px-2 text-xs">
            <Link href="/transactions" className="gap-1">
              See all <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
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
            Failed to load recent activity.
          </p>
        ) : transactions.length === 0 ? (
          <EmptyState
            icon={<ReceiptText />}
            title="No transactions yet"
            description="Start logging your first income or expense."
            className="py-8"
          />
        ) : (
          <ul className="min-w-0 divide-y divide-border/60">
            {transactions.map((tx) => {
              const parts = tx.description.split(' | ')
              const isIncome = tx.type === 'INCOME'
              return (
                <li
                  key={tx.id}
                  className="flex min-w-0 items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                >
                  <span
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm"
                    style={{
                      backgroundColor: `${tx.category.color}1F`,
                      color: tx.category.color,
                    }}
                    aria-hidden
                  >
                    {tx.category.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold tracking-tight">
                      {parts[0]}
                    </p>
                    <p className="truncate text-[11px] font-medium text-muted-foreground">
                      {formatDate(tx.date)}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'shrink-0 max-w-[45%] truncate font-mono text-[13px] font-semibold tabular-nums',
                      isIncome
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400',
                    )}
                  >
                    {isIncome ? '+' : '−'}
                    {formatCurrency(Number(tx.amount))}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
