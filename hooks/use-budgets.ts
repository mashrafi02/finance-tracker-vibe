import useSWR from 'swr'
import { useRouter } from 'next/navigation'
import { fetcher } from '@/lib/utils'

export type BudgetType = 'SPENDING' | 'INCOME_GOAL'

export interface BudgetStatus {
  categoryId: string
  categoryName: string
  categoryIcon: string
  categoryColor: string
  budgetId: string | null
  type: BudgetType
  limit: number | null
  spent: number
  remaining: number | null
  isOverspent: boolean
  isComplete?: boolean
  percentageUsed: number | null
}

interface BudgetsResponse {
  budgets: BudgetStatus[]
  spendingBudgets: BudgetStatus[]
  incomeGoals: BudgetStatus[]
  month: string
}

export function useBudgets(month: string) {
  const key = `/api/budgets?month=${month}`
  const router = useRouter()

  const { data, error, isLoading, mutate: mutateBudgets } = useSWR<BudgetsResponse>(
    key,
    fetcher
  )

  const createOrUpdateBudget = async (
    categoryId: string,
    limit: number,
    budgetMonth: string,
    type: BudgetType = 'SPENDING',
  ) => {
    const res = await fetch('/api/budgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categoryId, limit, month: budgetMonth, type }),
    })

    if (!res.ok) {
      const error = await res.json().catch(() => ({}))
      throw new Error(error.error ?? 'Failed to save budget')
    }

    await mutateBudgets()
    router.refresh()

    return res.json()
  }

  const deleteBudget = async (budgetId: string) => {
    const res = await fetch(`/api/budgets/${budgetId}`, {
      method: 'DELETE',
    })

    if (!res.ok) {
      const error = await res.json().catch(() => ({}))
      throw new Error(error.error ?? 'Failed to delete budget')
    }

    await mutateBudgets()
    router.refresh()
  }

  const addFundsToBudget = async (budgetId: string, amount: number) => {
    const res = await fetch('/api/budgets/add-funds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ budgetId, amount }),
    })

    if (!res.ok) {
      const error = await res.json().catch(() => ({}))
      throw new Error(error.error ?? 'Failed to add funds to budget')
    }

    await mutateBudgets()
    router.refresh()

    return res.json()
  }

  return {
    budgets: data?.spendingBudgets ?? data?.budgets ?? [],
    spendingBudgets: data?.spendingBudgets ?? data?.budgets ?? [],
    incomeGoals: data?.incomeGoals ?? [],
    month: data?.month ?? month,
    isLoading,
    isError: Boolean(error),
    error,
    createOrUpdateBudget,
    deleteBudget,
    addFundsToBudget,
    mutate: mutateBudgets,
  }
}

// Hook to get overspent categories for the current month
export function useOverspentCategories() {
  const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM format
  const { budgets, isLoading } = useBudgets(currentMonth)

  const overspentCategories = budgets.filter((budget) => budget.isOverspent)

  return {
    overspentCategories,
    isLoading,
    hasOverspent: overspentCategories.length > 0,
  }
}