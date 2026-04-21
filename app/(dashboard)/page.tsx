import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getAuthUser } from '@/lib/auth'
import { db } from '@/db'
import { transactions, categories } from '@/db/schema'
import { eq, desc, sql } from 'drizzle-orm'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import Link from 'next/link'
import {
  ArrowRight,
  CircleDollarSign,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { SummaryChart } from '@/components/charts/summary-chart'
import { OverspentBudgetAlert } from '@/components/budgets/overspent-budget-alert'

export default async function DashboardPage() {
  const user = await getAuthUser()
  if (!user) return null

  const [summary] = await db
    .select({
      totalIncome: sql<string>`COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END), 0)`,
      totalExpense: sql<string>`COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END), 0)`,
    })
    .from(transactions)
    .where(eq(transactions.userId, user.userId))

  const income = Number(summary?.totalIncome ?? 0)
  const expense = Number(summary?.totalExpense ?? 0)
  const balance = income - expense

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
      <section className="rounded-3xl border border-border/70 bg-card px-6 py-7 shadow-[0_12px_34px_rgba(0,0,0,0.04)] sm:px-8">
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
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card className="bg-gradient-to-b from-card to-muted/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-sm font-semibold">Balance</CardTitle>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Wallet className="h-4 w-4" />
            </span>
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                'text-[1.65rem] font-semibold tracking-tight',
                balance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
              )}
            >
              {formatCurrency(balance)}
            </div>
            <p className="mt-1 text-xs font-medium text-muted-foreground">All-time net balance</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-b from-card to-muted/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-sm font-semibold">Income</CardTitle>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
              <TrendingUp className="h-4 w-4" />
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-[1.65rem] font-semibold tracking-tight text-emerald-600 dark:text-emerald-400">
              +{formatCurrency(income)}
            </div>
            <p className="mt-1 text-xs font-medium text-muted-foreground">Total earnings</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-b from-card to-muted/20 sm:col-span-2 xl:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-sm font-semibold">Expenses</CardTitle>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300">
              <TrendingDown className="h-4 w-4" />
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-[1.65rem] font-semibold tracking-tight text-red-600 dark:text-red-400">
              −{formatCurrency(expense)}
            </div>
            <p className="mt-1 text-xs font-medium text-muted-foreground">Total spending</p>
          </CardContent>
        </Card>
      </div>

      <OverspentBudgetAlert />

      <SummaryChart />

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
            <div className="rounded-2xl border border-dashed border-border/80 bg-muted/25 px-6 py-10 text-center">
              <p className="mb-4 text-sm font-medium text-muted-foreground">
                No transactions yet. Start by adding your first transaction.
              </p>
              <Button asChild>
                <Link href="/transactions">Add Transaction</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {recentTransactions.map((tx) => {
                const parts = tx.description.split(' | ')
                return (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/20 px-4 py-3"
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
                          : 'text-red-600 dark:text-red-400'
                      )}
                    >
                      {tx.type === 'INCOME' ? '+' : '−'}
                      {formatCurrency(Number(tx.amount))}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
