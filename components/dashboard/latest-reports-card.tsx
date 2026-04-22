'use client'

import Link from 'next/link'
import { ArrowRight, FileText } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useReports } from '@/hooks/use-reports'
import { formatDate } from '@/lib/utils'

function formatMonthLong(month: string) {
  const [year, m] = month.split('-')
  const date = new Date(parseInt(year), parseInt(m) - 1)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
}

export function LatestReportsCard() {
  const { reports, isLoading, isError } = useReports()

  // Hide the card entirely when there are no reports (and we're not loading)
  if (!isLoading && !isError && reports.length === 0) {
    return null
  }

  const latest = reports.slice(0, 2)

  return (
    <Card className="h-full">
      <CardContent className="flex h-full flex-col p-5">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-sm font-semibold">Latest reports</h3>
            <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">
              Your most recent monthly summaries
            </p>
          </div>
          <Button variant="ghost" size="sm" asChild className="h-7 px-2 text-xs">
            <Link href="/reports" className="gap-1">
              See all <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-2.5 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <p className="py-6 text-center text-xs text-muted-foreground">
            Failed to load reports.
          </p>
        ) : (
          <ul className="divide-y divide-border/60">
            {latest.map((report) => (
              <li
                key={report.id}
                className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
              >
                <span
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400"
                  aria-hidden
                >
                  <FileText className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold tracking-tight">
                    {formatMonthLong(report.month)}
                  </p>
                  <p className="truncate text-[11px] font-medium text-muted-foreground">
                    Generated {formatDate(report.generatedAt)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
