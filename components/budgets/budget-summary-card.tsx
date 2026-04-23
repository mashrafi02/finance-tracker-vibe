'use client'

import { useMemo } from 'react'
import { RadialBar, RadialBarChart, PolarAngleAxis, PolarRadiusAxis, Label } from 'recharts'
import { CalendarDays, PiggyBank, Target, TrendingUp } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { type BudgetStatus } from '@/hooks/use-budgets'
import { formatCurrency, cn } from '@/lib/utils'

interface MonthOption {
  value: string
  label: string
}

interface BudgetSummaryCardProps {
  spendingBudgets: BudgetStatus[]
  incomeGoals: BudgetStatus[]
  selectedMonth: string
  monthOptions: MonthOption[]
  onMonthChange: (month: string) => void
}

const chartConfig = {
  spent: { label: 'Spent', color: 'var(--chart-1)' },
} satisfies ChartConfig

export function BudgetSummaryCard({
  spendingBudgets,
  incomeGoals,
  selectedMonth,
  monthOptions,
  onMonthChange,
}: BudgetSummaryCardProps) {
  const summary = useMemo(() => {
    const activeSpending = spendingBudgets.filter((b) => b.limit !== null)
    const totalLimit = activeSpending.reduce((acc, b) => acc + (b.limit ?? 0), 0)
    const totalSpent = activeSpending.reduce((acc, b) => acc + b.spent, 0)
    const overspentCount = activeSpending.filter((b) => b.isOverspent).length
    const warningCount = activeSpending.filter(
      (b) =>
        !b.isOverspent &&
        b.percentageUsed !== null &&
        b.percentageUsed >= 80,
    ).length
    const onTrackCount = activeSpending.length - overspentCount - warningCount

    const activeGoals = incomeGoals.filter((b) => b.limit !== null)
    const totalGoal = activeGoals.reduce((acc, b) => acc + (b.limit ?? 0), 0)
    const totalEarned = activeGoals.reduce((acc, b) => acc + b.spent, 0)

    return {
      activeSpendingCount: activeSpending.length,
      totalLimit,
      totalSpent,
      remaining: Math.max(0, totalLimit - totalSpent),
      spentPct:
        totalLimit > 0 ? Math.min(100, Math.round((totalSpent / totalLimit) * 100)) : 0,
      overspentCount,
      warningCount,
      onTrackCount,
      activeGoalsCount: activeGoals.length,
      totalGoal,
      totalEarned,
      goalPct:
        totalGoal > 0 ? Math.min(100, Math.round((totalEarned / totalGoal) * 100)) : 0,
    }
  }, [spendingBudgets, incomeGoals])

  // Single-row dataset: render the *spent* percentage as one radial arc
  // over a muted track. PolarAngleAxis with domain [0, 100] maps the
  // value to the arc length.
  const isOverall = summary.spentPct >= 100
  const chartData = [
    {
      key: 'budget',
      value: Math.min(summary.spentPct, 100),
      fill: isOverall ? 'var(--destructive)' : 'var(--color-spent)',
    },
  ]

  const hasSpending = summary.activeSpendingCount > 0
  const hasGoals = summary.activeGoalsCount > 0

  return (
    <Card className="h-full w-full min-w-0 overflow-hidden">
      <CardContent className="flex h-full min-w-0 flex-col gap-5 p-5">
        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <PiggyBank className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold">Month at a glance</h3>
              <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">
                Plan vs. activity for{' '}
                {monthOptions.find((m) => m.value === selectedMonth)?.label ?? 'this month'}
              </p>
            </div>
          </div>
        </div>

        {/* ── Month selector ─────────────────────────────────────── */}
        <Select
          value={selectedMonth}
          onValueChange={(value) => {
            if (value) onMonthChange(value)
          }}
        >
          <SelectTrigger className="h-9 w-full">
            <span className="flex items-center gap-2 text-xs font-semibold">
              <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
              <SelectValue placeholder="Select month" />
            </span>
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* ── Spending donut + figures ──────────────────────────── */}
        <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
          <div className="flex items-center gap-4">
            <div className="relative h-28 w-28 shrink-0">
              {hasSpending ? (
                <ChartContainer
                  config={chartConfig}
                  className="aspect-square h-full w-full"
                >
                  <RadialBarChart
                    data={chartData}
                    startAngle={90}
                    endAngle={-270}
                    innerRadius={42}
                    outerRadius={56}
                  >
                    <PolarAngleAxis
                      type="number"
                      domain={[0, 100]}
                      angleAxisId={0}
                      tick={false}
                    />
                    <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
                      <Label
                        position="center"
                        content={({ viewBox }) => {
                          if (!viewBox || !('cx' in viewBox)) return null
                          return (
                            <text
                              x={viewBox.cx}
                              y={viewBox.cy}
                              textAnchor="middle"
                              dominantBaseline="middle"
                            >
                              <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy ?? 0) - 4}
                                className={cn(
                                  'fill-foreground font-mono text-lg font-semibold tabular-nums',
                                  isOverall &&
                                    'fill-rose-600 dark:fill-rose-400',
                                )}
                              >
                                {summary.spentPct}%
                              </tspan>
                              <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy ?? 0) + 12}
                                className="fill-muted-foreground text-[10px] font-semibold uppercase tracking-wider"
                              >
                                used
                              </tspan>
                            </text>
                          )
                        }}
                      />
                    </PolarRadiusAxis>
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent hideLabel />}
                    />
                    <RadialBar
                      dataKey="value"
                      cornerRadius={6}
                      background={{ fill: 'var(--muted)' }}
                      className="stroke-transparent"
                    />
                  </RadialBarChart>
                </ChartContainer>
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-full border border-dashed border-border/80 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  No data
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Spent of budget
              </p>
              <p
                className="truncate font-mono text-xl font-semibold leading-none tabular-nums"
                title={formatCurrency(summary.totalSpent)}
              >
                {formatCurrency(summary.totalSpent)}
              </p>
              <p
                className="truncate text-[11px] font-medium text-muted-foreground"
                title={`of ${formatCurrency(summary.totalLimit)}`}
              >
                of{' '}
                <span className="font-mono text-foreground/80 tabular-nums">
                  {formatCurrency(summary.totalLimit)}
                </span>
              </p>
              <p
                className={cn(
                  'mt-1 text-[11px] font-semibold',
                  isOverall
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-emerald-600 dark:text-emerald-400',
                )}
              >
                {isOverall
                  ? `${formatCurrency(summary.totalSpent - summary.totalLimit)} over`
                  : `${formatCurrency(summary.remaining)} left`}
              </p>
            </div>
          </div>
        </div>

        {/* ── Status counts (spending) ───────────────────────────── */}
        {hasSpending && (
          <div className="grid grid-cols-3 gap-2">
            <StatPill
              label="On track"
              value={summary.onTrackCount}
              tone="success"
            />
            <StatPill
              label="Warning"
              value={summary.warningCount}
              tone="warn"
            />
            <StatPill
              label="Over"
              value={summary.overspentCount}
              tone="danger"
            />
          </div>
        )}

        {/* ── Income goals snapshot ──────────────────────────────── */}
        {hasGoals && (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  <Target className="h-3.5 w-3.5" />
                </span>
                <div>
                  <p className="text-[11px] font-semibold tracking-tight">
                    Income goals
                  </p>
                  <p className="text-[10px] font-medium text-muted-foreground">
                    {summary.activeGoalsCount} active
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-emerald-700 dark:text-emerald-300">
                {summary.goalPct}%
              </span>
            </div>

            <div className="mt-3 min-w-0">
              <div className="flex min-w-0 items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span
                  className="truncate font-mono text-base font-semibold tabular-nums"
                  title={formatCurrency(summary.totalEarned)}
                >
                  {formatCurrency(summary.totalEarned)}
                </span>
              </div>
              <p
                className="mt-1 truncate text-[11px] font-medium text-muted-foreground"
                title={`of ${formatCurrency(summary.totalGoal)}`}
              >
                of{' '}
                <span className="font-mono tabular-nums">
                  {formatCurrency(summary.totalGoal)}
                </span>
              </p>
            </div>

            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-emerald-500/15">
              <div
                className="h-full rounded-full bg-emerald-500 transition-[width] duration-500 ease-out"
                style={{ width: `${summary.goalPct}%` }}
                aria-hidden
              />
            </div>
          </div>
        )}

        {!hasSpending && !hasGoals && (
          <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-6 text-center">
            <p className="text-xs font-medium text-muted-foreground">
              Set a spending limit or income goal to see your monthly summary.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function StatPill({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: 'success' | 'warn' | 'danger'
}) {
  const toneClass =
    tone === 'success'
      ? 'border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-700 dark:text-emerald-300'
      : tone === 'warn'
        ? 'border-amber-500/25 bg-amber-500/[0.07] text-amber-700 dark:text-amber-300'
        : 'border-rose-500/25 bg-rose-500/[0.07] text-rose-700 dark:text-rose-300'

  return (
    <div
      className={cn(
        'rounded-xl border px-3 py-2.5 text-center',
        toneClass,
      )}
    >
      <p className="font-mono text-lg font-semibold leading-none tabular-nums">
        {value}
      </p>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider opacity-80">
        {label}
      </p>
    </div>
  )
}
