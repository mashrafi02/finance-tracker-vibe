'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { ArrowLeftRight, Percent, TrendingDown, TrendingUp } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Reveal } from '@/components/ui/reveal'
import { fetcher } from '@/lib/utils'
import { StatCard } from './stat-card'
import { SavingsGrowthChart } from './savings-growth-chart'
import { BudgetPerformanceCard } from './budget-performance-card'
import { IncomeExpenseBarChart } from '@/components/charts/income-expense-bar-chart'
import { SpendingByCategoryChart } from '@/components/charts/spending-by-category-chart'

type Range = '30d' | '90d' | '365d' | 'all'

interface OverviewStats {
  totalIncome: number
  totalExpense: number
  netCashFlow: number
  savingsRate: number
}

interface BudgetPerformance {
  totalBudget: number
  totalSpent: number
  percentageUsed: number
}

interface AnalyticsOverviewResponse {
  stats: OverviewStats
  budgetPerformance: BudgetPerformance
}

const RANGE_LABELS: Record<Range, string> = {
  '30d': 'Last 30 Days',
  '90d': 'Last 90 Days',
  '365d': 'Last 12 Months',
  all: 'All Time',
}

export function AnalyticsPageClient() {
  const [range, setRange] = useState<Range>('90d')

  const { data, isLoading } = useSWR<AnalyticsOverviewResponse>(
    `/api/analytics/overview?range=${range}`,
    fetcher,
  )

  const stats = data?.stats
  const budgetPerformance = data?.budgetPerformance

  const netCashFlow = stats?.netCashFlow ?? 0
  const isNetPositive = netCashFlow >= 0

  return (
    <div className="space-y-6">
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <Reveal as="section">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-[28px]">
              Analytics
            </h2>
            <p className="mt-1 text-sm font-medium text-muted-foreground">
              Visualize your financial data with interactive charts.
            </p>
          </div>
          <Select value={range} onValueChange={(v) => v && setRange(v as Range)}>
            <SelectTrigger className="h-9 w-full sm:w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="p-2 h-32!">
              {(Object.entries(RANGE_LABELS) as [Range, string][]).map(
                ([v, label]) => (
                  <SelectItem key={v} value={v}>
                    {label}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
        </div>
      </Reveal>

      {/* ── KPI stat cards ───────────────────────────────────────────── */}
      <div className="grid items-stretch gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Reveal delay={40} className="min-w-0">
          <StatCard
            title="Total Income"
            value={stats?.totalIncome ?? 0}
            isCurrency
            icon={<TrendingUp className="h-4 w-4" />}
            iconToneClass="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
            subtitle={RANGE_LABELS[range]}
            isLoading={isLoading}
          />
        </Reveal>
        <Reveal delay={80} className="min-w-0">
          <StatCard
            title="Total Expenses"
            value={stats?.totalExpense ?? 0}
            isCurrency
            icon={<TrendingDown className="h-4 w-4" />}
            iconToneClass="bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"
            subtitle={RANGE_LABELS[range]}
            isLoading={isLoading}
          />
        </Reveal>
        <Reveal delay={120} className="min-w-0">
          <StatCard
            title="Net Cash Flow"
            value={netCashFlow}
            isCurrency
            icon={<ArrowLeftRight className="h-4 w-4" />}
            iconToneClass={
              isNetPositive
                ? 'bg-primary/10 text-primary'
                : 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300'
            }
            valueColorClass={
              !isLoading && !isNetPositive
                ? 'text-rose-600 dark:text-rose-400'
                : undefined
            }
            subtitle="Income minus expenses"
            isLoading={isLoading}
          />
        </Reveal>
        <Reveal delay={160} className="min-w-0">
          <StatCard
            title="Savings Rate"
            value={stats?.savingsRate ?? 0}
            isCurrency={false}
            suffix="%"
            icon={<Percent className="h-4 w-4" />}
            iconToneClass="bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300"
            subtitle="Net flow ÷ total income"
            isLoading={isLoading}
          />
        </Reveal>
      </div>

      {/* ── Savings growth + Budget performance ─────────────────────── */}
      <div className="grid items-stretch gap-5 lg:grid-cols-3">
        <Reveal delay={40} className="min-w-0 lg:col-span-2">
          <SavingsGrowthChart />
        </Reveal>
        <Reveal delay={80} className="min-w-0 lg:col-span-1">
          <BudgetPerformanceCard
            totalBudget={budgetPerformance?.totalBudget ?? 0}
            totalSpent={budgetPerformance?.totalSpent ?? 0}
            percentageUsed={budgetPerformance?.percentageUsed ?? 0}
            isLoading={isLoading}
          />
        </Reveal>
      </div>

      {/* ── Existing charts (own range selectors) ───────────────────── */}
      <div className="grid gap-5 xl:grid-cols-2">
        <Reveal delay={40} className="min-w-0">
          <SpendingByCategoryChart />
        </Reveal>
        <Reveal delay={80} className="min-w-0">
          <IncomeExpenseBarChart />
        </Reveal>
      </div>
    </div>
  )
}
