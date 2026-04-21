import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getAuthUser } from '@/lib/auth'
import { db } from '@/db'
import { transactions, categories } from '@/db/schema'
import { and, eq, gte, lt, desc, sql } from 'drizzle-orm'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import Link from 'next/link'
import {
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  CircleDollarSign,
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
      <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
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
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums',
        flat && 'border border-border/70 bg-muted/40 text-muted-foreground',
        !flat && good && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
        !flat && !good && 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
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

  // Date windows for delta + sparkline.
  const now = new Date()
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const windowStart = new Date(startToday.getTime() - 29 * MS_DAY) // last 30 days incl today
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

  // Daily aggregates for sparklines (last 30 days).
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
  const balance = income - expense

  const curIncome = Number(currentWindow?.income ?? 0)
  const curExpense = Number(currentWindow?.expense ?? 0)
  const curBalance = curIncome - curExpense
  const prevIncome = Number(prevWindow?.income ?? 0)
  const prevExpense = Number(prevWindow?.expense ?? 0)
  const prevBalance = prevIncome - prevExpense

  const incomeDelta = pctDelta(curIncome, prevIncome)
  const expenseDelta = pctDelta(curExpense, prevExpense)
  const balanceDelta = pctDelta(curBalance, prevBalance)

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
    .limit(10)

  return (
    <div className="space-y-7">
      <Reveal
        as="section"
        className="rounded-3xl border border-border/70 bg-card px-6 py-7 shadow-[0_12px_34px_rgba(0,0,0,0.04)] sm:px-8"
      >
        <div className="flex items-start gap-4">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <CircleDollarSign className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
            <p className="mt-1 text-sm font-medium text-muted-foreground">
              Welcome back! Here&apos;s an overview of your finances.
            </p>
          </div>
        </div>
      </Reveal>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Reveal delay={80}>
          <Card className="h-full bg-gradient-to-b from-card to-muted/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-sm font-semibold">Balance</CardTitle>
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Wallet className="h-4 w-4" />
              </span>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'text-[1.85rem] font-semibold tracking-tight tabular-nums',
                    balance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400',
                  )}
                >
                  {formatCurrency(balance)}
                </span>
                <DeltaChip delta={balanceDelta} positiveIsGood />
              </div>
              <Sparkline data={balanceSpark} colorClass={balance >= 0 ? 'text-emerald-500/80' : 'text-red-500/80'} />
              <p className="text-xs font-medium text-muted-foreground">vs. previous 30 days</p>
            </CardContent>
          </Card>
        </Reveal>

        <Reveal delay={160}>
          <Card className="h-full bg-gradient-to-b from-card to-muted/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-sm font-semibold">Income</CardTitle>
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                <TrendingUp className="h-4 w-4" />
              </span>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-[1.85rem] font-semibold tracking-tight tabular-nums text-emerald-600 dark:text-emerald-400">
                  +{formatCurrency(income)}
                </span>
                <DeltaChip delta={incomeDelta} positiveIsGood />
              </div>
              <Sparkline data={incomeSpark} colorClass="text-emerald-500/80" />
              <p className="text-xs font-medium text-muted-foreground">Last 30 days trend</p>
            </CardContent>
          </Card>
        </Reveal>

        <Reveal delay={240} className="sm:col-span-2 xl:col-span-1">
          <Card className="h-full bg-gradient-to-b from-card to-muted/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-sm font-semibold">Expenses</CardTitle>
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300">
                <TrendingDown className="h-4 w-4" />
              </span>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-[1.85rem] font-semibold tracking-tight tabular-nums text-red-600 dark:text-red-400">
                  −{formatCurrency(expense)}
                </span>
                <DeltaChip delta={expenseDelta} positiveIsGood={false} />
              </div>
              <Sparkline data={expenseSpark} colorClass="text-red-500/80" />
              <p className="text-xs font-medium text-muted-foreground">Last 30 days trend</p>
            </CardContent>
          </Card>
        </Reveal>
      </div>

      <Reveal delay={280}>
        <OverspentBudgetAlert />
      </Reveal>

      <Reveal delay={320}>
        <SummaryChart />
      </Reveal>

      <Reveal delay={360}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Transactions</CardTitle>
              <p className="mt-1 text-sm font-medium text-muted-foreground">Your latest entries at a glance</p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/transactions">
                View all <ArrowRight className="ml-1 h-4 w-4" />
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
              <div className="space-y-2">
                {recentTransactions.map((tx, i) => {
                  const parts = tx.description.split(' | ')
                  return (
                    <Reveal
                      key={tx.id}
                      delay={380 + i * 30}
                      className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/20 px-4 py-3 transition-colors hover:bg-muted/40"
                    >
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-background text-base shadow-sm">
                          {tx.category.icon}
                        </span>
                        <div>
                          <p className="text-sm font-semibold tracking-tight">{parts[0]}</p>
                          <p className="text-xs font-medium text-muted-foreground">
                            {tx.category.name} • {formatDate(tx.date)}
                          </p>
                        </div>
                      </div>
                      <span
                        className={cn(
                          'font-mono text-sm font-semibold tabular-nums',
                          tx.type === 'INCOME'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-red-600 dark:text-red-400',
                        )}
                      >
                        {tx.type === 'INCOME' ? '+' : '−'}
                        {formatCurrency(Number(tx.amount))}
                      </span>
                    </Reveal>
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

