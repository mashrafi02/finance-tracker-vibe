'use client'

import { MoreHorizontal, Pencil, Trash2, Wallet } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { type BudgetStatus } from '@/hooks/use-budgets'
import { cn } from '@/lib/utils'
import { useCurrency } from '@/contexts/currency-context'

interface BudgetCardProps {
  budget: BudgetStatus
  onEdit: (budget: BudgetStatus) => void
  onDelete: (budget: BudgetStatus) => void
  onAddFunds?: (budget: BudgetStatus) => void
}

export function BudgetCard({
  budget,
  onEdit,
  onDelete,
  onAddFunds,
}: BudgetCardProps) {
  const { formatCurrency } = useCurrency()
  const limit = budget.limit ?? 0
  const percent = Math.round(budget.percentageUsed ?? 0)
  const isIncome = budget.type === 'INCOME_GOAL'

  // Spending semantics
  const isOver = !isIncome && budget.isOverspent
  const isWarn = !isIncome && percent >= 80 && !isOver

  // Income semantics
  const isComplete = isIncome && percent >= 100

  // Progress indicator color
  const indicatorClass = isIncome
    ? isComplete
      ? '[&_[data-slot=progress-indicator]]:bg-emerald-500'
      : '[&_[data-slot=progress-indicator]]:bg-emerald-500/80'
    : isOver
      ? '[&_[data-slot=progress-indicator]]:bg-rose-500'
      : isWarn
        ? '[&_[data-slot=progress-indicator]]:bg-amber-500'
        : '[&_[data-slot=progress-indicator]]:bg-primary'

  // Status pill text + color
  const statusLabel = isIncome
    ? isComplete
      ? 'Goal reached'
      : percent >= 80
        ? 'Almost there'
        : 'In progress'
    : isOver
      ? 'Over budget'
      : isWarn
        ? 'Approaching limit'
        : 'On track'

  const statusToneClass = isIncome
    ? isComplete
      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
      : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
    : isOver
      ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
      : isWarn
        ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
        : 'bg-muted text-muted-foreground'

  // Footer caption
  const remainingValue = budget.remaining ?? 0
  const footerCaption = isIncome
    ? isComplete
      ? `${formatCurrency(budget.spent - limit)} above goal`
      : `${formatCurrency(remainingValue)} to go`
    : remainingValue >= 0
      ? `${formatCurrency(remainingValue)} left`
      : `${formatCurrency(Math.abs(remainingValue))} over`

  const amountLabel = isIncome ? 'Earned' : 'Spent'

  return (
    <Card className="h-full w-full min-w-0 overflow-hidden">
      <CardContent className="flex h-full min-w-0 flex-col gap-4 p-5">
        {/* Header — category + actions */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base"
              style={{
                backgroundColor: `${budget.categoryColor}1F`,
                color: budget.categoryColor,
              }}
              aria-hidden
            >
              {budget.categoryIcon}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-tight">
                {budget.categoryName}
              </p>
              <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">
                {isIncome ? 'Income goal' : 'Spending limit'}
              </p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Budget actions"
              className={cn(
                buttonVariants({ variant: 'ghost', size: 'icon' }),
                'h-8 w-8 shrink-0',
              )}
            >
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!isIncome && onAddFunds && (
                <>
                  <DropdownMenuItem onClick={() => onAddFunds(budget)}>
                    <Wallet className="mr-2 h-4 w-4" />
                    Add funds
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onClick={() => onEdit(budget)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit {isIncome ? 'goal' : 'budget'}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(budget)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Hero amount */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {amountLabel}
          </p>
          <p
            className={cn(
              'mt-1 truncate font-mono text-2xl font-semibold leading-none tracking-tight tabular-nums',
              isOver && 'text-rose-600 dark:text-rose-400',
            )}
            title={formatCurrency(budget.spent)}
          >
            {formatCurrency(budget.spent)}
          </p>
          <p
            className="mt-1.5 truncate text-xs font-medium text-muted-foreground"
            title={`of ${formatCurrency(limit)}`}
          >
            of{' '}
            <span className="font-mono tabular-nums">{formatCurrency(limit)}</span>
          </p>
        </div>

        {/* Progress + footer */}
        <div className="mt-auto space-y-2">
          <div className="flex items-center gap-3">
            <Progress
              value={Math.min(percent, 100)}
              className={cn(
                'flex-1 [&>div]:h-1.5 [&>div]:bg-muted/70 [&>div]:rounded-full',
                indicatorClass,
              )}
            />
            <span
              className={cn(
                'w-9 shrink-0 text-right font-mono text-[11px] font-semibold tabular-nums',
                isOver
                  ? 'text-rose-600 dark:text-rose-400'
                  : isWarn
                    ? 'text-amber-700 dark:text-amber-400'
                    : isComplete
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-muted-foreground',
              )}
            >
              {percent}%
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide',
                statusToneClass,
              )}
            >
              {statusLabel}
            </span>
            <span
              className={cn(
                'font-mono text-[11px] font-medium tabular-nums',
                isOver
                  ? 'text-rose-600 dark:text-rose-400'
                  : isComplete
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-muted-foreground',
              )}
            >
              {footerCaption}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface EmptyBudgetSlotProps {
  budget: BudgetStatus
  onCreate: (budget: BudgetStatus) => void
}

/**
 * Compact card shown for a category that has no budget set yet.
 * Smaller than `BudgetCard` to keep the grid breathable.
 */
export function EmptyBudgetSlot({ budget, onCreate }: EmptyBudgetSlotProps) {
  const { formatCurrency } = useCurrency()
  const isIncome = budget.type === 'INCOME_GOAL'
  return (
    <button
      type="button"
      onClick={() => onCreate(budget)}
      className="group flex h-full w-full min-w-0 flex-col gap-3 rounded-2xl border border-dashed border-border/80 bg-card/40 p-5 text-left transition-colors hover:border-border hover:bg-card"
    >
      <div className="flex items-center gap-2.5">
        <span
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base opacity-90 group-hover:opacity-100"
          style={{
            backgroundColor: `${budget.categoryColor}1F`,
            color: budget.categoryColor,
          }}
          aria-hidden
        >
          {budget.categoryIcon}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-tight">
            {budget.categoryName}
          </p>
          <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">
            No {isIncome ? 'goal' : 'limit'} set ·{' '}
            <span className="text-foreground/80">
              {formatCurrency(budget.spent)}
            </span>{' '}
            {isIncome ? 'earned' : 'spent'}
          </p>
        </div>
      </div>
      <span
        className={cn(
          'mt-auto inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide',
          'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary',
        )}
      >
        + Set {isIncome ? 'goal' : 'budget'}
      </span>
    </button>
  )
}
