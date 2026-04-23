'use client'

import { TrendingDown, TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useCurrency } from '@/contexts/currency-context'
import { DeltaChip } from './delta-chip'

interface MonthlySummaryCardProps {
  label: 'Monthly Spent' | 'Monthly Income'
  amount: number
  delta: number | null
  periodLabel: string
}

export function MonthlySummaryCard({
  label,
  amount,
  delta,
  periodLabel,
}: MonthlySummaryCardProps) {
  const { formatCurrency } = useCurrency()
  const isIncome = label === 'Monthly Income'
  const amountClass = isIncome
    ? 'text-foreground'
    : 'text-foreground'
  const Icon = isIncome ? TrendingUp : TrendingDown
  const iconTone = isIncome
    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
    : 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300'

  return (
    <Card className="h-full">
      <CardContent className="flex h-full flex-col gap-4 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'inline-flex h-8 w-8 items-center justify-center rounded-lg',
                iconTone,
              )}
            >
              <Icon className="h-4 w-4" />
            </span>
            <span className="text-sm font-semibold text-muted-foreground">
              {label}
            </span>
          </div>
          <span className="inline-flex items-center rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
            {periodLabel}
          </span>
        </div>

        <div>
          <span
            className={cn(
              'text-[1.9rem] font-semibold leading-none tracking-tight tabular-nums',
              amountClass,
            )}
          >
            {formatCurrency(amount)}
          </span>
        </div>

        <div className="mt-auto flex items-center gap-2">
          <DeltaChip delta={delta} positiveIsGood={isIncome} />
          <span className="text-[11px] font-medium text-muted-foreground">
            Compared to last month
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
