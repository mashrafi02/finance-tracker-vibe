'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { useReport } from '@/hooks/use-reports'
import { formatCurrency } from '@/lib/utils'
import { AlertCircle } from 'lucide-react'

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
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto sm:max-w-2xl">
        {isLoading || !report ? (
          <LoadingState />
        ) : isError ? (
          <ErrorState />
        ) : (
          <>
            <DialogHeader className="pb-1">
              <DialogTitle className="text-xl font-semibold tracking-tight">
                {formatMonth(report.month)} Report
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Generated on{' '}
                {new Date(report.generatedAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-0 divide-y divide-border">
              {/* ── Summary ───────────────────────────────────────── */}
              <Section title="Summary">
                <SummaryRow label="Total Income" value={`+${formatCurrency(report.reportData.summary.totalIncome)}`} tone="positive" />
                <SummaryRow label="Total Expenses" value={`−${formatCurrency(report.reportData.summary.totalExpenses)}`} tone="negative" />
                <SummaryRow label="Net Income" value={formatCurrency(report.reportData.summary.netIncome)} tone={Number(report.reportData.summary.netIncome) >= 0 ? 'positive' : 'negative'} />
                <div className="my-2 border-t border-dashed border-border" />
                <SummaryRow label="Total Savings" value={formatCurrency(report.reportData.summary.totalSavings)} />
                <SummaryRow label="Current Balance" value={formatCurrency(report.reportData.summary.currentBalance)} />
                <SummaryRow label="Savings Rate" value={`${report.reportData.summary.savingsRate}%`} />
              </Section>

              {/* ── Income by category ────────────────────────────── */}
              {report.reportData.incomeByCategory.length > 0 && (
                <Section title="Income by Category">
                  {report.reportData.incomeByCategory.map((item) => (
                    <CategoryRow
                      key={item.categoryId}
                      icon={item.categoryIcon}
                      name={item.categoryName}
                      count={item.count}
                      amount={`+${formatCurrency(item.amount)}`}
                      tone="positive"
                    />
                  ))}
                </Section>
              )}

              {/* ── Expenses by category ──────────────────────────── */}
              {report.reportData.expensesByCategory.length > 0 && (
                <Section title="Expenses by Category">
                  {report.reportData.expensesByCategory.map((item) => (
                    <CategoryRow
                      key={item.categoryId}
                      icon={item.categoryIcon}
                      name={item.categoryName}
                      count={item.count}
                      amount={`−${formatCurrency(item.amount)}`}
                      tone="negative"
                    />
                  ))}
                </Section>
              )}

              {/* ── Savings contributions ─────────────────────────── */}
              {report.reportData.savingsByGoal.length > 0 && (
                <Section title="Savings Contributions">
                  {report.reportData.savingsByGoal.map((item) => (
                    <CategoryRow
                      key={item.goalId}
                      icon="🎯"
                      name={item.goalName}
                      count={item.count}
                      countLabel="contribution"
                      amount={`+${formatCurrency(item.amount)}`}
                      tone="positive"
                    />
                  ))}
                </Section>
              )}

              {/* ── Activity ──────────────────────────────────────── */}
              <Section title="Activity">
                <SummaryRow label="Transactions" value={String(report.reportData.transactionCount)} />
                <SummaryRow label="Active Budgets" value={String(report.reportData.budgetCount)} />
                <SummaryRow label="Savings Entries" value={String(report.reportData.savingsEntryCount)} />
              </Section>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

/* ── Sub-components ───────────────────────────────────────────────────── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="py-4">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        {title}
      </p>
      <div className="space-y-1">{children}</div>
    </div>
  )
}

function SummaryRow({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone?: 'positive' | 'negative'
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-0.5">
      <span className="text-sm text-foreground">{label}</span>
      <span
        className={
          tone === 'positive'
            ? 'font-mono text-sm font-medium tabular-nums text-emerald-600 dark:text-emerald-400'
            : tone === 'negative'
              ? 'font-mono text-sm font-medium tabular-nums text-rose-600 dark:text-rose-400'
              : 'font-mono text-sm font-medium tabular-nums text-foreground'
        }
      >
        {value}
      </span>
    </div>
  )
}

function CategoryRow({
  icon,
  name,
  count,
  countLabel = 'transaction',
  amount,
  tone,
}: {
  icon: string
  name: string
  count: number
  countLabel?: string
  amount: string
  tone: 'positive' | 'negative'
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="shrink-0 text-base leading-none">{icon}</span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{name}</p>
          <p className="text-[11px] text-muted-foreground">
            {count} {countLabel}{count === 1 ? '' : 's'}
          </p>
        </div>
      </div>
      <span
        className={
          tone === 'positive'
            ? 'shrink-0 font-mono text-sm font-medium tabular-nums text-emerald-600 dark:text-emerald-400'
            : 'shrink-0 font-mono text-sm font-medium tabular-nums text-rose-600 dark:text-rose-400'
        }
      >
        {amount}
      </span>
    </div>
  )
}

function LoadingState() {
  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-xl">Loading report...</DialogTitle>
        <DialogDescription>Fetching your financial data</DialogDescription>
      </DialogHeader>
      <div className="space-y-3 pt-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="mt-4 h-4 w-32" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
      </div>
    </>
  )
}

function ErrorState() {
  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-xl">Failed to load report</DialogTitle>
        <DialogDescription>Something went wrong</DialogDescription>
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


