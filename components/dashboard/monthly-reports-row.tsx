'use client'

import type { ReactNode } from 'react'
import { useReports } from '@/hooks/use-reports'
import { LatestReportsCard } from './latest-reports-card'

interface MonthlyReportsRowProps {
  spentCard: ReactNode
  incomeCard: ReactNode
}

export function MonthlyReportsRow({
  spentCard,
  incomeCard,
}: MonthlyReportsRowProps) {
  const { reports, isLoading, isError } = useReports()

  // Match the visibility logic used inside LatestReportsCard:
  // hide the report column when there are no reports (and we're not loading/erroring).
  const hasReports = isLoading || isError || reports.length > 0

  return (
    <div
      className={
        hasReports
          ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3'
          : 'grid gap-4 sm:grid-cols-2'
      }
    >
      {spentCard}
      {incomeCard}
      {hasReports ? <LatestReportsCard /> : null}
    </div>
  )
}
