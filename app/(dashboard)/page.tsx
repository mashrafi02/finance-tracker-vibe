import { getAuthUser } from '@/lib/auth'
import { db } from '@/db'
import { transactions } from '@/db/schema'
import { and, eq, gte, lt, sql } from 'drizzle-orm'
import Link from 'next/link'
import { ArrowUpRight, CalendarDays } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Reveal } from '@/components/ui/reveal'

import { SummaryChart } from '@/components/charts/summary-chart'
import { OverspentBudgetAlert } from '@/components/budgets/overspent-budget-alert'

import { BalanceCard } from '@/components/dashboard/balance-card'
import { MonthlySummaryCard } from '@/components/dashboard/monthly-summary-card'
import { RecentActivityCard } from '@/components/dashboard/recent-activity-card'
import { SavingsCard } from '@/components/dashboard/savings-card'

function pctDelta(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null
  return ((current - previous) / Math.abs(previous)) * 100
}

export default async function DashboardPage() {
  const user = await getAuthUser()
  if (!user) return null

  const now = new Date()

  // Calendar-month bounds (this month + previous month)
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  // All-time totals — for My Balance (net worth)
  const [lifetime] = await db
    .select({
      income: sql<string>`COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END), 0)`,
      expense: sql<string>`COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END), 0)`,
    })
    .from(transactions)
    .where(eq(transactions.userId, user.userId))

  // This month
  const [thisMonth] = await db
    .select({
      income: sql<string>`COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END), 0)`,
      expense: sql<string>`COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END), 0)`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, user.userId),
        gte(transactions.date, thisMonthStart),
        lt(transactions.date, nextMonthStart),
      ),
    )

  // Previous month
  const [prevMonth] = await db
    .select({
      income: sql<string>`COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END), 0)`,
      expense: sql<string>`COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END), 0)`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, user.userId),
        gte(transactions.date, lastMonthStart),
        lt(transactions.date, thisMonthStart),
      ),
    )

  const lifetimeIncome = Number(lifetime?.income ?? 0)
  const lifetimeExpense = Number(lifetime?.expense ?? 0)
  const totalBalance = lifetimeIncome - lifetimeExpense

  const curIncome = Number(thisMonth?.income ?? 0)
  const curExpense = Number(thisMonth?.expense ?? 0)
  const prvIncome = Number(prevMonth?.income ?? 0)
  const prvExpense = Number(prevMonth?.expense ?? 0)

  // Previous net worth ≈ current net worth minus this month's activity
  const prevBalance = totalBalance - (curIncome - curExpense)
  const balanceDelta = pctDelta(totalBalance, prevBalance)
  const incomeDelta = pctDelta(curIncome, prvIncome)
  const expenseDelta = pctDelta(curExpense, prvExpense)

  const emailPrefix = user.email?.split('@')[0] ?? 'there'
  const prettyName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1)
  const todayPretty = new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(now)
  const monthLabel = new Intl.DateTimeFormat('en-US', {
    month: 'short',
  }).format(now)

  return (
    <div className="space-y-6">
      {/* Hero row */}
      <Reveal
        as="section"
        className="flex flex-wrap items-center justify-between gap-4"
      >
        <div>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-[28px]">
            Welcome back, {prettyName}
            <span className="ml-2 inline-block" aria-hidden>
              👋
            </span>
          </h2>
          <p className="mt-1 text-sm font-medium text-muted-foreground">
            Here&apos;s an overview of your finances today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-3 text-xs font-semibold text-foreground shadow-card">
            <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
            {todayPretty}
          </span>
          <Button asChild size="default" className="gap-1.5">
            <Link href="/transactions?new=1">
              <ArrowUpRight className="h-4 w-4" />
              New Transaction
            </Link>
          </Button>
        </div>
      </Reveal>

      <Reveal delay={40}>
        <OverspentBudgetAlert />
      </Reveal>

      {/* Main grid: left rail (1/3) + right content (2/3) */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* ─── LEFT RAIL ─────────────────────────────────────────── */}
        <div className="space-y-4 lg:col-span-1">
          <Reveal delay={80}>
            <BalanceCard
              totalBalance={totalBalance}
              delta={balanceDelta}
              periodLabel={monthLabel}
            />
          </Reveal>

          <Reveal delay={140}>
            <RecentActivityCard />
          </Reveal>
        </div>

        {/* ─── RIGHT CONTENT ─────────────────────────────────────── */}
        <div className="space-y-4 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <Reveal delay={100}>
              <MonthlySummaryCard
                label="Monthly Spent"
                amount={curExpense}
                delta={expenseDelta}
                periodLabel={monthLabel}
              />
            </Reveal>
            <Reveal delay={160}>
              <MonthlySummaryCard
                label="Monthly Income"
                amount={curIncome}
                delta={incomeDelta}
                periodLabel={monthLabel}
              />
            </Reveal>
          </div>

          <Reveal delay={220}>
            <SummaryChart />
          </Reveal>

          <Reveal delay={280}>
            <SavingsCard />
          </Reveal>
        </div>
      </div>
    </div>
  )
}
