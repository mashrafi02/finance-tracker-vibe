import useSWR from 'swr'
import { fetcher } from '@/lib/utils'

export interface SavingsGoal {
  id: string
  name: string
  targetAmount: string
  savedAmount: string
  createdAt: string
  userId: string
}

interface SavingsGoalsResponse {
  goals: SavingsGoal[]
}

export function useSavingsGoals() {
  const { data, error, isLoading, mutate } = useSWR<SavingsGoalsResponse>(
    '/api/savings-goals',
    fetcher,
  )

  const createGoal = async (values: { name: string; targetAmount: number }) => {
    const res = await fetch('/api/savings-goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error ?? 'Failed to create savings goal')
    }

    await mutate()
    return res.json()
  }

  const updateGoal = async (
    id: string,
    values: { name?: string; targetAmount?: number },
  ) => {
    const res = await fetch(`/api/savings-goals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error ?? 'Failed to update savings goal')
    }

    await mutate()
    return res.json()
  }

  const deleteGoal = async (id: string) => {
    const res = await fetch(`/api/savings-goals/${id}`, { method: 'DELETE' })

    if (!res.ok && res.status !== 204) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error ?? 'Failed to delete savings goal')
    }

    await mutate()
  }

  return {
    goals: data?.goals ?? [],
    isLoading,
    isError: Boolean(error),
    error,
    createGoal,
    updateGoal,
    deleteGoal,
    mutate,
  }
}
