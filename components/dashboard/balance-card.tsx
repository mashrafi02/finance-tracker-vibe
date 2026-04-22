import Link from 'next/link'
import { ArrowDownLeft, ArrowUpRight, Plus, Wallet } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
      <CardContent className="flex h-full flex-col gap-5 p-5">
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

        <div className="flex items-end gap-2">
          <span
            className={cn(
              'text-[2rem] font-semibold leading-none tracking-tight tabular-nums',
              totalBalance < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-foreground',
            )}
          >
            {totalBalance < 0 ? '−' : ''}
            {formatCurrency(Math.abs(totalBalance))}
          </span>
          <DeltaChip delta={delta} positiveIsGood />
        </div>

        <p className="text-xs font-medium text-muted-foreground">
          Income minus expenses across all time
        </p>

        <div className="mt-auto grid grid-cols-3 gap-2 pt-1">
          <Button asChild size="sm" className="col-span-1 gap-1.5">
            <Link href="/transactions?new=1&type=EXPENSE">
              <ArrowUpRight className="h-3.5 w-3.5" />
              Spend
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="col-span-1 gap-1.5"
          >
            <Link href="/transactions?new=1&type=INCOME">
              <ArrowDownLeft className="h-3.5 w-3.5" />
              Receive
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="col-span-1"
            aria-label="Add transaction"
          >
            <Link href="/transactions?new=1">
              <Plus className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
