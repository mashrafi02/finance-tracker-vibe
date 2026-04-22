import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getAuthUser } from '@/lib/auth'
import { db } from '@/db'
import { transactions, categories, budgets } from '@/db/schema'
import { and, eq, gte, lt, desc, sql } from 'drizzle-orm'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import Link from 'next/link'
import {
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  CalendarDays,
  Minus,
  TrendingDown,
  TrendingUp,
  Wallet,
  ReceiptText,
} from 'lucide-react'
import { SummaryChart } from '@/components/charts/summary-chart'
import { Sparkline } from '@/components/charts/sparkline'
import { OverspentBudgetAlert } from '@/components/budgets/overspent-budget-alert'
import { Reveal } from '@/components/ui/reveal'
import { EmptyState } from '@/components/ui/empty-state'

const MS_DAY = 1000 * 60 * 60 * 24

function pctDelta(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null
  return ((current - previous) / Math.abs(previous)) * 100
}

function DeltaChip({ delta, positiveIsGood = true }: { delta: number | null; positiveIsGood?: boolean }) {
  if (delta === null) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
        <Minus className="h-3 w-3" /> new
      </span>
    )
  }
  const rounded = Math.round(delta * 10) / 10
  const up = rounded > 0
  const flat = rounded === 0
  const good = flat ? true : up === positiveIsGood
  const Icon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums',
        flat && 'bg-muted text-muted-foreground',
        !flat && good && 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
        !flat && !good && 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
      )}
    >
      <Icon className="h-3 w-3" />
      {flat ? '0%' : `${up ? '+' : ''}${rounded}%`}
    </span>
  )
}

export default async function DashboardPage() {
  const user = await getAuthUser()
  if (!user) return null

  const now = new Date()
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const windowStart = new Date(startToday.getTime() - 29 * MS_DAY)
  const prevWindowStart = new Date(startToday.getTime() - 59 * MS_DAY)

  const [summary] = await db
    .select({
      totalIncome: sql<string>`COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END), 0)`,
      totalExpense: sql<string>`COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END), 0)`,
    })
    .from(transactions)
    .where(eq(transactions.userId, user.userId))

  const [currentWindow] = await db
    .select({
      income: sql<string>`COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END), 0)`,
      expense: sql<string>`COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END), 0)`,
    })
    .from(transactions)
    .where(and(eq(transactions.userId, user.userId), gte(transactions.date, windowStart)))

  const [prevWindow] = await db
    .select({
      income: sql<string>`COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END), 0)`,
      expense: sql<string>`COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END), 0)`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, user.userId),
        gte(transactions.date, prevWindowStart),
        lt(transactions.date, windowStart),
      ),
    )

  const dailyRows = await db
    .select({
      day: sql<string>`DATE(${transactions.date})`,
      income: sql<string>`COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END), 0)`,
      expense: sql<string>`COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END), 0)`,
    })
    .from(transactions)
    .where(and(eq(transactions.userId, user.userId), gte(transactions.date, windowStart)))
    .groupBy(sql`DATE(${transactions.date})`)

  const dailyMap = new Map<string, { income: number; expense: number }>()
  for (const row of dailyRows) {
    dailyMap.set(row.day, { income: Number(row.income), expense: Number(row.expense) })
  }
  const incomeSpark: { value: number }[] = []
  const expenseSpark: { value: number }[] = []
  const balanceSpark: { value: number }[] = []
  let runningBalance = 0
  for (let i = 29; i >= 0; i--) {
    const d = new Date(startToday.getTime() - i * MS_DAY)
    const key = d.toISOString().split('T')[0]
    const entry = dailyMap.get(key) ?? { income: 0, expense: 0 }
    incomeSpark.push({ value: entry.income })
    expenseSpark.push({ value: entry.expense })
    runningBalance += entry.income - entry.expense
    balanceSpark.push({ value: runningBalance })
  }

  const income = Number(summary?.totalIncome ?? 0)
  const expense = Number(summary?.totalExpense ?? 0)

  const currentMonth = now.toISOString().slice(0, 7)
  const [budgetTotal] = await db
    .select({
      total: sql<string>`COALESCE(SUM(${budgets.limit}), 0)`,
    })
    .from(budgets)
    .where(and(eq(budgets.userId, user.userId), eq(budgets.month, currentMonth)))

  const balance = Number(budgetTotal?.total ?? 0)

  const curIncome = Number(currentWindow?.income ?? 0)
  const curExpense = Number(currentWindow?.expense ?? 0)
  const prevIncome = Number(prevWindow?.income ?? 0)
  const prevExpense = Number(prevWindow?.expense ?? 0)

  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 7)
  const [prevBudgetTotal] = await db
    .select({
      total: sql<string>`COALESCE(SUM(${budgets.limit}), 0)`,
    })
    .from(budgets)
    .where(and(eq(budgets.userId, user.userId), eq(budgets.month, prevMonth)))

  const prevBudgetSum = Number(prevBudgetTotal?.total ?? 0)

  const incomeDelta = pctDelta(curIncome, prevIncome)
  const expenseDelta = pctDelta(curExpense, prevExpense)
  const balanceDelta = pctDelta(balance, prevBudgetSum)

  const recentTransactions = await db
    .select({
      id: transactions.id,
      amount: transactions.amount,
      type: transactions.type,
      description: transactions.description,
      date: transactions.date,
      category: {
        name: categories.name,
        icon: categories.icon,
      },
    })
    .from(transactions)
    .innerJoin(categories, eq(transactions.categoryId, categories.id))
    .where(eq(transactions.userId, user.userId))
    .orderBy(desc(transactions.date))
    .limit(8)

  const emailPrefix = user.email?.split('@')[0] ?? 'there'
  const prettyName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1)
  const todayPretty = new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(now)
  const monthLabel = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(now)

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
            <span className="ml-2 inline-block" aria-hidden>👋</span>
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

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Reveal delay={60}>
          <MetricCard
            title="Balance"
            period={monthLabel}
            amount={formatCurrency(balance)}
            amountClass="text-foreground"
            delta={<DeltaChip delta={balanceDelta} positiveIsGood />}
            icon={<Wallet className="h-4 w-4" />}
            iconTone="primary"
            footer={
              <p className="text-xs font-medium text-muted-foreground">
                Total budget limits • {new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(now)}
              </p>
            }
            sparkline={<Sparkline data={balanceSpark} colorClass="text-primary/60" />}
          />
        </Reveal>

        <Reveal delay={120}>
          <MetricCard
            title="Income"
            period="Last 30d"
            amount={`+${formatCurrency(income)}`}
            amountClass="text-emerald-600 dark:text-emerald-400"
            delta={<DeltaChip delta={incomeDelta} positiveIsGood />}
            icon={<TrendingUp className="h-4 w-4" />}
            iconTone="success"
            footer={<p className="text-xs font-medium text-muted-foreground">30-day trend</p>}
            sparkline={<Sparkline data={incomeSpark} colorClass="text-emerald-500/80" />}
          />
        </Reveal>

        <Reveal delay={180} className="sm:col-span-2 xl:col-span-1">
          <MetricCard
            title="Expenses"
            period="Last 30d"
            amount={`−${formatCurrency(expense)}`}
            amountClass="text-rose-600 dark:text-rose-400"
            delta={<DeltaChip delta={expenseDelta} positiveIsGood={false} />}
            icon={<TrendingDown className="h-4 w-4" />}
            iconTone="danger"
            footer={<p className="text-xs font-medium text-muted-foreground">30-day trend</p>}
            sparkline={<Sparkline data={expenseSpark} colorClass="text-rose-500/80" />}
          />
        </Reveal>
      </div>

      <Reveal delay={220}>
        <OverspentBudgetAlert />
      </Reveal>

      <Reveal delay={260}>
        <SummaryChart />
      </Reveal>

      <Reveal delay={300}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Recent activity</CardTitle>
              <p className="mt-1 text-xs font-medium text-muted-foreground">
                Your latest entries at a glance
              </p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/transactions" className="gap-1">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentTransactions.length === 0 ? (
              <EmptyState
                icon={<ReceiptText />}
                title="No transactions yet"
                description="Start tracking your money by logging your first income or expense."
                action={
                  <Button asChild>
                    <Link href="/transactions">Add Transaction</Link>
                  </Button>
                }
              />
            ) : (
              <div className="-mx-1 divide-y divide-border/60">
                {recentTransactions.map((tx) => {
                  const parts = tx.description.split(' | ')
                  const isIncome = tx.type === 'INCOME'
                  return (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between gap-3 rounded-lg px-1.5 py-3 transition-colors hover:bg-muted/40"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-base">
                          {tx.category.icon}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold tracking-tight text-foreground">
                            {parts[0]}
                          </p>
                          <p className="truncate text-xs font-medium text-muted-foreground">
                            {tx.category.name}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-4">
                        <span className="hidden text-xs font-medium text-muted-foreground sm:inline">
                          {formatDate(tx.date)}
                        </span>
                        <span
                          className={cn(
                            'font-mono text-sm font-semibold tabular-nums',
                            isIncome
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400',
                          )}
                        >
                          {isIncome ? '+' : '−'}
                          {formatCurrency(Number(tx.amount))}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </Reveal>
    </div>
  )
}

function MetricCard({
  title,
  period,
  amount,
  amountClass,
  delta,
  icon,
  iconTone,
  footer,
  sparkline,
}: {
  title: string
  period: string
  amount: string
  amountClass?: string
  delta: React.ReactNode
  icon: React.ReactNode
  iconTone: 'primary' | 'success' | 'danger'
  footer: React.ReactNode
  sparkline?: React.ReactNode
}) {
  const toneClass =
    iconTone === 'primary'
      ? 'bg-primary/10 text-primary'
      : iconTone === 'success'
      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
      : 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300'

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <span className={cn('inline-flex h-8 w-8 items-center justify-center rounded-lg', toneClass)}>
            {icon}
          </span>
          <CardTitle className="text-sm font-semibold text-muted-foreground">{title}</CardTitle>
        </div>
        <span className="inline-flex items-center rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
          {period}
        </span>
      </CardHeader>
      <CardContent className="space-y-3 pt-1">
        <div className="flex items-end gap-2">
          <span className={cn('text-[1.9rem] font-semibold leading-none tracking-tight tabular-nums', amountClass)}>
            {amount}
          </span>
          {delta}
        </div>
        {sparkline}
        {footer}
      </CardContent>
    </Card>
  )
}

