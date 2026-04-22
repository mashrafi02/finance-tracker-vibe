import useSWR from 'swr'
import { fetcher } from '@/lib/utils'

export interface ReportListItem {
  id: string
  month: string
  generatedAt: string
}

interface ReportsResponse {
  reports: ReportListItem[]
}

export function useReports() {
  const { data, error, isLoading, mutate } = useSWR<ReportsResponse>(
    '/api/reports',
    fetcher,
  )

  return {
    reports: data?.reports ?? [],
    isLoading,
    isError: Boolean(error),
    mutate,
  }
}

export interface CategoryBreakdown {
  categoryId: string
  categoryName: string
  categoryColor: string
  categoryIcon: string
  amount: string
  count: number
}

export interface BudgetComparison {
  categoryId: string
  categoryName: string
  categoryColor: string
  categoryIcon: string
  budgetType: 'SPENDING' | 'INCOME_GOAL'
  budgetLimit: string
  actualAmount: string
  difference: string
  percentageUsed: number
}

export interface SavingsByGoal {
  goalId: string
  goalName: string
  goalTarget: string
  amount: string
  count: number
}

export interface ReportData {
  month: string
  generatedAt: string
  summary: {
    totalIncome: string
    totalExpenses: string
    totalSavings: string
    totalBudget: string
    currentBalance: string
    netIncome: string
    savingsRate: number
  }
  incomeByCategory: CategoryBreakdown[]
  expensesByCategory: CategoryBreakdown[]
  budgetComparison: BudgetComparison[]
  savingsByGoal: SavingsByGoal[]
  transactionCount: number
  budgetCount: number
  savingsEntryCount: number
}

export interface FullReport {
  id: string
  month: string
  generatedAt: string
  userId: string
  reportData: ReportData
}

export function useReport(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR<FullReport>(
    id ? `/api/reports/${id}` : null,
    fetcher,
  )

  return {
    report: data,
    isLoading,
    isError: Boolean(error),
    mutate,
  }
}
