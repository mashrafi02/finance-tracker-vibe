import useSWR from 'swr'
import { fetcher } from '@/lib/utils'

export interface BudgetStatus {
  categoryId: string
  categoryName: string
  categoryIcon: string
  categoryColor: string
  budgetId: string | null
  limit: number | null
  spent: number
  remaining: number | null
  isOverspent: boolean
  percentageUsed: number | null
}

interface BudgetsResponse {
  budgets: BudgetStatus[]
  month: string
}

export function useBudgets(month: string) {
  const key = `/api/budgets?month=${month}`
  
  const { data, error, isLoading, mutate: mutateBudgets } = useSWR<BudgetsResponse>(
    key,
    fetcher
  )

  const createOrUpdateBudget = async (categoryId: string, limit: number, budgetMonth: string) => {
    const res = await fetch('/api/budgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categoryId, limit, month: budgetMonth }),
    })

    if (!res.ok) {
      const error = await res.json().catch(() => ({}))
      throw new Error(error.error ?? 'Failed to save budget')
    }

    // Revalidate the current month's data
    await mutateBudgets()
    
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

    // Revalidate the current month's data
    await mutateBudgets()
  }

  return {
    budgets: data?.budgets ?? [],
    month: data?.month ?? month,
    isLoading,
    isError: Boolean(error),
    error,
    createOrUpdateBudget,
    deleteBudget,
    mutate: mutateBudgets,
  }
}

// Hook to get overspent categories for the current month
export function useOverspentCategories() {
  const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM format
  const { budgets, isLoading } = useBudgets(currentMonth)
  
  const overspentCategories = budgets.filter(budget => budget.isOverspent)
  
  return {
    overspentCategories,
    isLoading,
    hasOverspent: overspentCategories.length > 0,
  }
}