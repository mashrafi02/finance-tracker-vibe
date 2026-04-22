import { db } from '@/db'
import { monthlyReports, transactions, categories, budgets, savingsEntries, savingsGoals, accounts } from '@/db/schema'
import { getAuthUser } from '@/lib/auth'
import { generateReportSchema } from '@/lib/validations/report'
import { eq, and, gte, lte, sql } from 'drizzle-orm'

export async function POST(req: Request) {
  // 1. Authenticate
  const user = await getAuthUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Parse and validate body
  const body = await req.json()
  const result = generateReportSchema.safeParse(body)
  if (!result.success) {
    return Response.json(
      { error: 'Validation failed', details: result.error.flatten() },
      { status: 400 },
    )
  }

  const { month } = result.data

  try {
    // 3. Check if report already exists
    const [existing] = await db
      .select({ id: monthlyReports.id })
      .from(monthlyReports)
      .where(
        and(
          eq(monthlyReports.userId, user.userId),
          eq(monthlyReports.month, month),
        ),
      )
      .limit(1)

    if (existing) {
      return Response.json(
        { error: 'A report for this month already exists' },
        { status: 409 },
      )
    }

    // 4. Calculate month boundaries
    const [year, m] = month.split('-').map(Number)
    const startDate = new Date(year, m - 1, 1)
    const endDate = new Date(year, m, 0, 23, 59, 59, 999)

    // 5. Fetch transactions with category details
    const transactionsData = await db
      .select({
        id: transactions.id,
        amount: transactions.amount,
        type: transactions.type,
        description: transactions.description,
        date: transactions.date,
        category: {
          id: categories.id,
          name: categories.name,
          color: categories.color,
          icon: categories.icon,
        },
      })
      .from(transactions)
      .innerJoin(categories, eq(transactions.categoryId, categories.id))
      .where(
        and(
          eq(transactions.userId, user.userId),
          gte(transactions.date, startDate),
          lte(transactions.date, endDate),
        ),
      )

    // 6. Fetch budgets for the month
    const budgetsData = await db
      .select({
        id: budgets.id,
        limit: budgets.limit,
        type: budgets.type,
        month: budgets.month,
        category: {
          id: categories.id,
          name: categories.name,
          color: categories.color,
          icon: categories.icon,
        },
      })
      .from(budgets)
      .innerJoin(categories, eq(budgets.categoryId, categories.id))
      .where(
        and(
          eq(budgets.userId, user.userId),
          eq(budgets.month, month),
        ),
      )

    // 7. Fetch savings entries with goal details
    const savingsData = await db
      .select({
        id: savingsEntries.id,
        amount: savingsEntries.amount,
        date: savingsEntries.date,
        goal: {
          id: savingsGoals.id,
          name: savingsGoals.name,
          targetAmount: savingsGoals.targetAmount,
        },
      })
      .from(savingsEntries)
      .innerJoin(savingsGoals, eq(savingsEntries.savingsGoalId, savingsGoals.id))
      .where(
        and(
          eq(savingsEntries.userId, user.userId),
          gte(savingsEntries.date, startDate),
          lte(savingsEntries.date, endDate),
        ),
      )

    // 8. Fetch account balance
    const [accountData] = await db
      .select({ balance: accounts.balance })
      .from(accounts)
      .where(eq(accounts.userId, user.userId))
      .limit(1)

    // 9. Aggregate income by category
    const incomeByCategory = transactionsData
      .filter((t) => t.type === 'INCOME')
      .reduce(
        (acc, t) => {
          const existing = acc.find((item) => item.categoryId === t.category.id)
          if (existing) {
            existing.amount = (Number(existing.amount) + Number(t.amount)).toFixed(2)
            existing.count += 1
          } else {
            acc.push({
              categoryId: t.category.id,
              categoryName: t.category.name,
              categoryColor: t.category.color,
              categoryIcon: t.category.icon,
              amount: t.amount,
              count: 1,
            })
          }
          return acc
        },
        [] as Array<{
          categoryId: string
          categoryName: string
          categoryColor: string
          categoryIcon: string
          amount: string
          count: number
        }>,
      )

    // 10. Aggregate expenses by category
    const expensesByCategory = transactionsData
      .filter((t) => t.type === 'EXPENSE')
      .reduce(
        (acc, t) => {
          const existing = acc.find((item) => item.categoryId === t.category.id)
          if (existing) {
            existing.amount = (Number(existing.amount) + Number(t.amount)).toFixed(2)
            existing.count += 1
          } else {
            acc.push({
              categoryId: t.category.id,
              categoryName: t.category.name,
              categoryColor: t.category.color,
              categoryIcon: t.category.icon,
              amount: t.amount,
              count: 1,
            })
          }
          return acc
        },
        [] as Array<{
          categoryId: string
          categoryName: string
          categoryColor: string
          categoryIcon: string
          amount: string
          count: number
        }>,
      )

    // 11. Build budget vs actual comparison
    const budgetComparison = budgetsData.map((budget) => {
      const actual = transactionsData
        .filter(
          (t) =>
            t.category.id === budget.category.id &&
            (budget.type === 'SPENDING' ? t.type === 'EXPENSE' : t.type === 'INCOME'),
        )
        .reduce((sum, t) => sum + Number(t.amount), 0)

      return {
        categoryId: budget.category.id,
        categoryName: budget.category.name,
        categoryColor: budget.category.color,
        categoryIcon: budget.category.icon,
        budgetType: budget.type,
        budgetLimit: budget.limit,
        actualAmount: actual.toFixed(2),
        difference: (Number(budget.limit) - actual).toFixed(2),
        percentageUsed: Number(budget.limit) > 0
          ? Math.round((actual / Number(budget.limit)) * 100)
          : 0,
      }
    })

    // 12. Aggregate savings by goal
    const savingsByGoal = savingsData.reduce(
      (acc, entry) => {
        const existing = acc.find((item) => item.goalId === entry.goal.id)
        if (existing) {
          existing.amount = (Number(existing.amount) + Number(entry.amount)).toFixed(2)
          existing.count += 1
        } else {
          acc.push({
            goalId: entry.goal.id,
            goalName: entry.goal.name,
            goalTarget: entry.goal.targetAmount,
            amount: entry.amount,
            count: 1,
          })
        }
        return acc
      },
      [] as Array<{
        goalId: string
        goalName: string
        goalTarget: string
        amount: string
        count: number
      }>,
    )

    // 13. Calculate totals
    const totalIncome = incomeByCategory.reduce(
      (sum, cat) => sum + Number(cat.amount),
      0,
    )
    const totalExpenses = expensesByCategory.reduce(
      (sum, cat) => sum + Number(cat.amount),
      0,
    )
    const totalSavings = savingsByGoal.reduce(
      (sum, goal) => sum + Number(goal.amount),
      0,
    )
    const totalBudget = budgetsData
      .filter((b) => b.type === 'SPENDING')
      .reduce((sum, b) => sum + Number(b.limit), 0)

    // 14. Build final report data
    const reportData = {
      month,
      generatedAt: new Date().toISOString(),
      summary: {
        totalIncome: totalIncome.toFixed(2),
        totalExpenses: totalExpenses.toFixed(2),
        totalSavings: totalSavings.toFixed(2),
        totalBudget: totalBudget.toFixed(2),
        currentBalance: accountData?.balance ?? '0',
        netIncome: (totalIncome - totalExpenses).toFixed(2),
        savingsRate:
          totalIncome > 0
            ? Math.round((totalSavings / totalIncome) * 100)
            : 0,
      },
      incomeByCategory,
      expensesByCategory,
      budgetComparison,
      savingsByGoal,
      transactionCount: transactionsData.length,
      budgetCount: budgetsData.length,
      savingsEntryCount: savingsData.length,
    }

    // 15. Insert report into database
    const [created] = await db
      .insert(monthlyReports)
      .values({
        month,
        reportData,
        userId: user.userId,
      })
      .returning()

    return Response.json(created, { status: 201 })
  } catch (error) {
    console.error('[POST /api/reports/generate]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
