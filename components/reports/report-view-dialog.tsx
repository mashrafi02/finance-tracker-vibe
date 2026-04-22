'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { useReport } from '@/hooks/use-reports'
import { formatCurrency, cn } from '@/lib/utils'
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Sprout,
  Target,
  AlertCircle,
} from 'lucide-react'

interface ReportViewDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  reportId: string | null
}

function formatMonth(month: string) {
  const [year, m] = month.split('-')
  const date = new Date(parseInt(year), parseInt(m) - 1)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
}

export function ReportViewDialog({
  isOpen,
  onOpenChange,
  reportId,
}: ReportViewDialogProps) {
  const { report, isLoading, isError } = useReport(isOpen ? reportId : null)

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto sm:max-w-3xl">
        {isLoading || !report ? (
          <LoadingState />
        ) : isError ? (
          <ErrorState />
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">
                {formatMonth(report.month)} Report
              </DialogTitle>
              <DialogDescription className="mt-1">
                Generated on{' '}
                {new Date(report.generatedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 pt-2">
              <SummarySection data={report.reportData.summary} />

              {report.reportData.incomeByCategory.length > 0 && (
                <>
                  <Separator />
                  <CategoryListSection
                    title="Income by category"
                    icon={<TrendingUp className="h-4 w-4 text-emerald-600" />}
                    items={report.reportData.incomeByCategory}
                    variant="income"
                  />
                </>
              )}

              {report.reportData.expensesByCategory.length > 0 && (
                <>
                  <Separator />
                  <CategoryListSection
                    title="Expenses by category"
                    icon={<TrendingDown className="h-4 w-4 text-rose-600" />}
                    items={report.reportData.expensesByCategory}
                    variant="expense"
                  />
                </>
              )}

              {report.reportData.savingsByGoal.length > 0 && (
                <>
                  <Separator />
                  <SavingsSection items={report.reportData.savingsByGoal} />
                </>
              )}

              <Separator />
              <StatsSection
                transactionCount={report.reportData.transactionCount}
                budgetCount={report.reportData.budgetCount}
                savingsEntryCount={report.reportData.savingsEntryCount}
              />
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function LoadingState() {
  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-xl">Loading report...</DialogTitle>
        <DialogDescription>Fetching your financial data</DialogDescription>
      </DialogHeader>
      <div className="space-y-3">
        <Skeleton className="h-20 rounded-lg" />
        <Skeleton className="h-32 rounded-lg" />
        <Skeleton className="h-32 rounded-lg" />
      </div>
    </>
  )
}

function ErrorState() {
  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-xl">Failed to load report</DialogTitle>
      </DialogHeader>
      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <AlertCircle className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          We couldn&apos;t load this report. Please try again.
        </p>
      </div>
    </>
  )
}

function SummarySection({
  data,
}: {
  data: {
    totalIncome: string
    totalExpenses: string
    totalSavings: string
    totalBudget: string
    currentBalance: string
    netIncome: string
    savingsRate: number
  }
}) {
  const netIncomeValue = Number(data.netIncome)
  return (
    <section>
      <h3 className="mb-3 text-sm font-semibold">Summary</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <SummaryCard
          label="Total income"
          value={formatCurrency(data.totalIncome)}
          icon={<TrendingUp className="h-3.5 w-3.5" />}
          tone="emerald"
        />
        <SummaryCard
          label="Total expenses"
          value={formatCurrency(data.totalExpenses)}
          icon={<TrendingDown className="h-3.5 w-3.5" />}
          tone="rose"
        />
        <SummaryCard
          label="Net income"
          value={formatCurrency(data.netIncome)}
          icon={<Wallet className="h-3.5 w-3.5" />}
          tone={netIncomeValue >= 0 ? 'emerald' : 'rose'}
        />
        <SummaryCard
          label="Total savings"
          value={formatCurrency(data.totalSavings)}
          icon={<Sprout className="h-3.5 w-3.5" />}
          tone="violet"
        />
        <SummaryCard
          label="Current balance"
          value={formatCurrency(data.currentBalance)}
          icon={<Wallet className="h-3.5 w-3.5" />}
          tone="blue"
        />
        <SummaryCard
          label="Savings rate"
          value={`${data.savingsRate}%`}
          icon={<Target className="h-3.5 w-3.5" />}
          tone="amber"
        />
      </div>
    </section>
  )
}

const TONE_CLASSES: Record<string, string> = {
  emerald:
    'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300',
  rose: 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-300',
  violet:
    'bg-violet-500/10 border-violet-500/20 text-violet-700 dark:text-violet-300',
  blue: 'bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-300',
  amber:
    'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-300',
}

function SummaryCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string
  value: string
  icon: React.ReactNode
  tone: keyof typeof TONE_CLASSES | string
}) {
  return (
    <div
      className={cn(
        'rounded-lg border p-3 transition-colors',
        TONE_CLASSES[tone] ?? TONE_CLASSES.blue,
      )}
    >
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider opacity-80">
        {icon}
        {label}
      </div>
      <p className="mt-1.5 font-mono text-base font-semibold tabular-nums">
        {value}
      </p>
    </div>
  )
}

function CategoryListSection({
  title,
  icon,
  items,
  variant,
}: {
  title: string
  icon: React.ReactNode
  items: Array<{
    categoryId: string
    categoryName: string
    categoryColor: string
    categoryIcon: string
    amount: string
    count: number
  }>
  variant: 'income' | 'expense'
}) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li
            key={item.categoryId}
            className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-card px-3 py-2"
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-sm"
                style={{
                  backgroundColor: `${item.categoryColor}20`,
                  color: item.categoryColor,
                }}
              >
                {item.categoryIcon}
              </div>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium">
                  {item.categoryName}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {item.count} transaction{item.count === 1 ? '' : 's'}
                </p>
              </div>
            </div>
            <span
              className={cn(
                'shrink-0 font-mono text-[13px] font-semibold tabular-nums',
                variant === 'income'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400',
              )}
            >
              {variant === 'income' ? '+' : '-'}
              {formatCurrency(item.amount)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function SavingsSection({
  items,
}: {
  items: Array<{
    goalId: string
    goalName: string
    goalTarget: string
    amount: string
    count: number
  }>
}) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <Sprout className="h-4 w-4 text-emerald-600" />
        <h3 className="text-sm font-semibold">Savings contributions</h3>
      </div>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li
            key={item.goalId}
            className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-card px-3 py-2"
          >
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium">{item.goalName}</p>
              <p className="text-[11px] text-muted-foreground">
                Target: {formatCurrency(item.goalTarget)} ·{' '}
                {item.count} contribution{item.count === 1 ? '' : 's'}
              </p>
            </div>
            <span className="shrink-0 font-mono text-[13px] font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
              +{formatCurrency(item.amount)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function StatsSection({
  transactionCount,
  budgetCount,
  savingsEntryCount,
}: {
  transactionCount: number
  budgetCount: number
  savingsEntryCount: number
}) {
  return (
    <section>
      <h3 className="mb-3 text-sm font-semibold">Activity</h3>
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Transactions" value={transactionCount} />
        <StatCard label="Active budgets" value={budgetCount} />
        <StatCard label="Contributions" value={savingsEntryCount} />
      </div>
    </section>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border/60 bg-card p-3 text-center">
      <p className="font-mono text-lg font-semibold tabular-nums">{value}</p>
      <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">
        {label}
      </p>
    </div>
  )
}
