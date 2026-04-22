'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Check, Pencil, PiggyBank, Plus, Target, Trash2, Wallet, X } from 'lucide-react'
import { useBudgets, type BudgetStatus } from '@/hooks/use-budgets'
import { formatCurrency, cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Reveal } from '@/components/ui/reveal'
import { EmptyState } from '@/components/ui/empty-state'
import { AddFundsDialog } from './add-funds-dialog'

function getMonthOptions() {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  const cur = `${y}-${String(m + 1).padStart(2, '0')}`
  let ny = y
  let nm = m + 1
  if (nm > 11) {
    ny += 1
    nm = 0
  }
  const next = `${ny}-${String(nm + 1).padStart(2, '0')}`
  const fmt = (s: string) => {
    const [yy, mm] = s.split('-')
    return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(
      new Date(parseInt(yy), parseInt(mm) - 1),
    )
  }
  return [
    { value: cur, label: fmt(cur) },
    { value: next, label: fmt(next) },
  ]
}

interface BudgetRowProps {
  budget: BudgetStatus
  onSave: (categoryId: string, limit: number) => Promise<void>
  onDelete: (budgetId: string) => Promise<void>
  onAddFunds: (budget: BudgetStatus) => void
}

function BudgetRow({ budget, onSave, onDelete, onAddFunds }: BudgetRowProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [limitValue, setLimitValue] = useState(budget.limit?.toString() ?? '')
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleSave = async () => {
    const limit = parseFloat(limitValue)
    if (isNaN(limit) || limit <= 0) {
      toast.error('Please enter a valid amount')
      return
    }
    setIsSaving(true)
    try {
      await onSave(budget.categoryId, limit)
      setIsEditing(false)
      toast.success('Budget saved')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save budget')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!budget.budgetId) return
    setIsDeleting(true)
    try {
      await onDelete(budget.budgetId)
      toast.success('Budget removed')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to remove budget')
    } finally {
      setIsDeleting(false)
    }
  }

  const percent = Math.round(budget.percentageUsed ?? 0)
  const hasBudget = budget.limit !== null
  const isIncomeGoal = budget.type === 'INCOME_GOAL'

  // Spending semantics
  const isOver = !isIncomeGoal && budget.isOverspent
  const isWarn = !isIncomeGoal && percent >= 80 && !isOver

  // Income goal semantics
  const isComplete = isIncomeGoal && percent >= 100

  const indicatorClass = isIncomeGoal
    ? isComplete
      ? '[&_[data-slot=progress-indicator]]:bg-emerald-500'
      : '[&_[data-slot=progress-indicator]]:bg-emerald-500/80'
    : isOver
    ? '[&_[data-slot=progress-indicator]]:bg-rose-500'
    : isWarn
    ? '[&_[data-slot=progress-indicator]]:bg-amber-500'
    : '[&_[data-slot=progress-indicator]]:bg-primary'

  const trackClass = '[&>div]:h-2 [&>div]:bg-muted/70 [&>div]:rounded-full'

  return (
    <div className="flex h-full flex-col gap-3 rounded-xl border border-border/70 bg-card px-4 py-3.5 transition-colors hover:bg-muted/30">
      {/* Header: icon + name + actions */}
      <div className="flex items-center gap-3">
        <span
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base"
          style={{
            backgroundColor: `${budget.categoryColor}1F`,
            color: budget.categoryColor,
          }}
        >
          {budget.categoryIcon}
        </span>

        <div className="min-w-0 flex-1 pt-0.5">
          <p className="truncate text-sm font-semibold tracking-tight uppercase">
            {budget.categoryName}
          </p>
          {!hasBudget && !isEditing && (
            <p className="mt-0.5 truncate text-xs font-medium text-muted-foreground">
              {isIncomeGoal
                ? `${formatCurrency(budget.spent)} earned this month`
                : `${formatCurrency(budget.spent)} spent this month`}
            </p>
          )}
        </div>

        {!isEditing && (
          <div className="flex shrink-0 items-center gap-1">
            {hasBudget ? (
              <>
                {!isIncomeGoal && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-muted-foreground hover:bg-primary/10 hover:text-primary"
                    onClick={() => onAddFunds(budget)}
                    disabled={isSaving || isDeleting}
                    aria-label="Add funds to budget"
                    title="Add funds"
                  >
                    <Wallet className="h-3.5 w-3.5" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => {
                    setLimitValue(budget.limit?.toString() ?? '')
                    setIsEditing(true)
                  }}
                  disabled={isSaving || isDeleting}
                  aria-label={isIncomeGoal ? 'Edit goal' : 'Edit budget'}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
                  onClick={handleDelete}
                  disabled={isSaving || isDeleting}
                  aria-label={isIncomeGoal ? 'Remove goal' : 'Remove budget'}
                >
                  {isDeleting ? (
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() => {
                  setLimitValue('')
                  setIsEditing(true)
                }}
              >
                <Plus className="h-3.5 w-3.5" />
                Set
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Body */}
      {hasBudget && !isEditing && (
        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-mono text-[13px] font-semibold tabular-nums text-foreground">
              {formatCurrency(budget.spent)}
              <span className="text-muted-foreground/60"> / </span>
              <span className="text-muted-foreground">{formatCurrency(budget.limit!)}</span>
            </span>
            <span
              className={cn(
                'text-[11px] font-semibold tabular-nums',
                isIncomeGoal
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : isOver
                  ? 'text-rose-600 dark:text-rose-400'
                  : isWarn
                  ? 'text-amber-700 dark:text-amber-400'
                  : 'text-muted-foreground',
              )}
            >
              {percent}%
            </span>
          </div>

          <Progress
            value={Math.min(percent, 100)}
            className={cn('gap-0', trackClass, indicatorClass)}
          />

          <div className="flex items-center justify-between text-[11px] font-medium">
            <span
              className={cn(
                isIncomeGoal && isComplete
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-muted-foreground',
              )}
            >
              {isIncomeGoal
                ? isComplete
                  ? 'Goal reached'
                  : percent >= 80
                  ? 'Almost there'
                  : 'In progress'
                : isOver
                ? 'Over budget'
                : isWarn
                ? 'Approaching limit'
                : 'On track'}
            </span>
            <span
              className={cn(
                'tabular-nums',
                isIncomeGoal
                  ? isComplete
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-muted-foreground'
                  : isOver
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-muted-foreground',
              )}
            >
              {isIncomeGoal
                ? isComplete
                  ? `${formatCurrency(budget.spent - (budget.limit ?? 0))} above`
                  : `${formatCurrency(budget.remaining ?? 0)} to go`
                : budget.remaining !== null && budget.remaining >= 0
                ? `${formatCurrency(budget.remaining)} left`
                : `${formatCurrency(Math.abs(budget.remaining || 0))} over`}
            </span>
          </div>
        </div>
      )}

      {isEditing && (
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-xs font-semibold text-muted-foreground">
              $
            </span>
            <Input
              type="number"
              step="0.01"
              autoFocus
              placeholder="0.00"
              value={limitValue}
              onChange={(e) => setLimitValue(e.target.value)}
              className="h-9 pl-6 text-sm"
              disabled={isSaving}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave()
                if (e.key === 'Escape') setIsEditing(false)
              }}
            />
          </div>
          <Button
            size="icon-sm"
            onClick={handleSave}
            disabled={isSaving || !limitValue}
            aria-label="Save"
          >
            {isSaving ? (
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={() => setIsEditing(false)}
            disabled={isSaving}
            aria-label="Cancel"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  )
}

function BudgetListSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
        <Skeleton className="h-9 w-40" />
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-3 rounded-xl border border-border/70 px-4 py-3.5">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <Skeleton className="h-3 flex-1" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
              <div className="flex justify-between">
                <Skeleton className="h-2.5 w-16" />
                <Skeleton className="h-2.5 w-20" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function BudgetList() {
  const monthOptions = getMonthOptions()
  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0].value)
  const [fundsTarget, setFundsTarget] = useState<BudgetStatus | null>(null)
  const [fundsOpen, setFundsOpen] = useState(false)
  const {
    spendingBudgets,
    incomeGoals,
    isLoading,
    createOrUpdateBudget,
    deleteBudget,
  } = useBudgets(selectedMonth)

  if (isLoading) {
    return <BudgetListSkeleton />
  }

  const handleSaveSpending = async (categoryId: string, limit: number) => {
    await createOrUpdateBudget(categoryId, limit, selectedMonth, 'SPENDING')
  }

  const handleSaveIncome = async (categoryId: string, limit: number) => {
    await createOrUpdateBudget(categoryId, limit, selectedMonth, 'INCOME_GOAL')
  }

  const handleAddFunds = (budget: BudgetStatus) => {
    setFundsTarget(budget)
    setFundsOpen(true)
  }

  const totalLimit = spendingBudgets.reduce((acc, b) => acc + (b.limit ?? 0), 0)
  const totalSpent = spendingBudgets.reduce((acc, b) => acc + b.spent, 0)
  const withBudgets = spendingBudgets.filter((b) => b.limit !== null)
  const withoutBudgets = spendingBudgets.filter((b) => b.limit === null)
  const overallPct = totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0
  const overspentCount = withBudgets.filter((b) => b.isOverspent).length

  const activeGoals = incomeGoals.filter((b) => b.limit !== null)
  const availableForGoal = incomeGoals.filter((b) => b.limit === null)
  const totalGoal = activeGoals.reduce((acc, b) => acc + (b.limit ?? 0), 0)
  const totalEarned = activeGoals.reduce((acc, b) => acc + b.spent, 0)
  const goalPct = totalGoal > 0 ? Math.round((totalEarned / totalGoal) * 100) : 0
  const goalsReached = activeGoals.filter((b) => b.isComplete).length

  return (
    <Card className='mb-20'>
      <CardHeader className="flex flex-col gap-4 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <PiggyBank className="h-4 w-4" />
          </span>
          <div>
            <CardTitle className="text-base">Budget management</CardTitle>
            <p className="mt-0.5 text-xs font-medium text-muted-foreground">
              Set monthly spending limits and income goals per category
            </p>
          </div>
        </div>
        <Select
          value={selectedMonth}
          onValueChange={(value) => {
            if (value) setSelectedMonth(value)
          }}
        >
          <SelectTrigger className="h-9 w-full rounded-lg sm:w-[180px]">
            <SelectValue placeholder="Select month" />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* ─── SPENDING SECTION ─────────────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
            <h3 className="text-sm font-semibold tracking-tight">Spending limits</h3>
            <span className="text-[11px] font-medium text-muted-foreground">
              · What you plan to spend
            </span>
          </div>

          {withBudgets.length > 0 && (
            <div className="grid gap-3 rounded-2xl border border-border/70 bg-muted/30 p-4 sm:grid-cols-3">
              <SummaryStat label="Total budget" value={formatCurrency(totalLimit)} />
              <SummaryStat
                label="Spent"
                value={formatCurrency(totalSpent)}
                sub={`${overallPct}% of total`}
                tone={overallPct >= 100 ? 'danger' : overallPct >= 80 ? 'warn' : 'default'}
              />
              <SummaryStat
                label="Categories over"
                value={String(overspentCount)}
                sub={overspentCount === 0 ? 'All on track' : 'Need attention'}
                tone={overspentCount > 0 ? 'danger' : 'success'}
              />
            </div>
          )}

          {spendingBudgets.length === 0 ? (
            <EmptyState
              icon={<PiggyBank />}
              title="No categories to budget"
              description="Create some categories first so you can set monthly spending limits for them."
            />
          ) : (
            <div className="space-y-5">
              {withBudgets.length > 0 && (
                <div className="space-y-2">
                  <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Active budgets ({withBudgets.length})
                  </p>
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {withBudgets.map((budget, i) => (
                      <Reveal key={budget.categoryId} delay={i * 30}>
                        <BudgetRow
                          budget={budget}
                          onSave={handleSaveSpending}
                          onDelete={deleteBudget}
                          onAddFunds={handleAddFunds}
                        />
                      </Reveal>
                    ))}
                  </div>
                </div>
              )}

              {withoutBudgets.length > 0 && (
                <div className="space-y-2">
                  <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    No limit set ({withoutBudgets.length})
                  </p>
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {withoutBudgets.map((budget, i) => (
                      <Reveal key={budget.categoryId} delay={i * 30}>
                        <BudgetRow
                          budget={budget}
                          onSave={handleSaveSpending}
                          onDelete={deleteBudget}
                          onAddFunds={handleAddFunds}
                        />
                      </Reveal>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* ─── INCOME GOALS SECTION ────────────────────────────────── */}
        <section className="space-y-4 border-t border-border/60 pt-6">
          <div className="flex items-center gap-2">
            <Target className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-semibold tracking-tight">Income goals</h3>
            <span className="text-[11px] font-medium text-muted-foreground">
              · What you aim to earn
            </span>
          </div>

          {activeGoals.length > 0 && (
            <div className="grid gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-4 sm:grid-cols-3">
              <SummaryStat label="Total goal" value={formatCurrency(totalGoal)} />
              <SummaryStat
                label="Earned"
                value={formatCurrency(totalEarned)}
                sub={`${goalPct}% of goal`}
                tone="success"
              />
              <SummaryStat
                label="Goals reached"
                value={`${goalsReached} / ${activeGoals.length}`}
                sub={goalsReached === activeGoals.length ? 'All achieved' : 'Keep going'}
                tone="success"
              />
            </div>
          )}

          {incomeGoals.length === 0 ? (
            <EmptyState
              icon={<Target />}
              title="No categories available"
              description="Create some categories so you can set monthly income goals for them."
            />
          ) : (
            <div className="space-y-5">
              {activeGoals.length > 0 && (
                <div className="space-y-2">
                  <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Active goals ({activeGoals.length})
                  </p>
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {activeGoals.map((budget, i) => (
                      <Reveal key={budget.categoryId} delay={i * 30}>
                        <BudgetRow
                          budget={budget}
                          onSave={handleSaveIncome}
                          onDelete={deleteBudget}
                          onAddFunds={handleAddFunds}
                        />
                      </Reveal>
                    ))}
                  </div>
                </div>
              )}

              {availableForGoal.length > 0 && (
                <details className="group" open={activeGoals.length === 0}>
                  <summary className="flex cursor-pointer list-none items-center gap-1.5 px-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-foreground">
                    <Plus className="h-3 w-3 transition-transform group-open:rotate-45" />
                    {activeGoals.length === 0
                      ? `Set a goal (${availableForGoal.length} available)`
                      : `Set goal for more categories (${availableForGoal.length})`}
                  </summary>
                  <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {availableForGoal.map((budget, i) => (
                      <Reveal key={budget.categoryId} delay={i * 30}>
                        <BudgetRow
                          budget={budget}
                          onSave={handleSaveIncome}
                          onDelete={deleteBudget}
                          onAddFunds={handleAddFunds}
                        />
                      </Reveal>
                    ))}
                  </div>
                </details>
              )}
            </div>
          )}
        </section>
      </CardContent>

      <AddFundsDialog
        budget={fundsTarget}
        month={selectedMonth}
        open={fundsOpen}
        onOpenChange={setFundsOpen}
      />
    </Card>
  )
}

function SummaryStat({
  label,
  value,
  sub,
  tone = 'default',
}: {
  label: string
  value: string
  sub?: string
  tone?: 'default' | 'warn' | 'danger' | 'success'
}) {
  const subTone =
    tone === 'danger'
      ? 'text-rose-600 dark:text-rose-400'
      : tone === 'warn'
      ? 'text-amber-700 dark:text-amber-400'
      : tone === 'success'
      ? 'text-emerald-600 dark:text-emerald-400'
      : 'text-muted-foreground'
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold tracking-tight tabular-nums">{value}</p>
      {sub && <p className={cn('mt-0.5 text-[11px] font-medium', subTone)}>{sub}</p>}
    </div>
  )
}
