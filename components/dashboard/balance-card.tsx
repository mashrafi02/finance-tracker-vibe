import { Wallet } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency, cn } from '@/lib/utils'
import { DeltaChip } from './delta-chip'

interface BalanceCardProps {
  totalBalance: number
  delta: number | null
  periodLabel: string
}

export function BalanceCard({ totalBalance, delta, periodLabel }: BalanceCardProps) {
  return (
    <Card className="h-full">
      <CardContent className="flex h-full flex-col gap-4 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Wallet className="h-4 w-4" />
            </span>
            <span className="text-sm font-semibold text-muted-foreground">
              My Balance
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
              totalBalance < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-foreground',
            )}
          >
            {totalBalance < 0 ? '−' : ''}
            {formatCurrency(Math.abs(totalBalance))}
          </span>
        </div>

        <div className="mt-auto flex items-center gap-2">
          <DeltaChip delta={delta} positiveIsGood />
          <span className="text-[11px] font-medium text-muted-foreground">
            Income minus expenses across all time
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
