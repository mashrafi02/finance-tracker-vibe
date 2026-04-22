import useSWR, { useSWRConfig } from 'swr'
import { useRouter } from 'next/navigation'
import { fetcher } from '@/lib/utils'

export interface SavingsEntry {
  id: string
  amount: string
  date: string
  createdAt: string
  savingsGoalId: string
  userId: string
}

interface SavingsEntriesResponse {
  entries: SavingsEntry[]
}

export function useSavingsEntries(goalId: string | null) {
  const { mutate: globalMutate } = useSWRConfig()
  const router = useRouter()
  const key = goalId ? `/api/savings-goals/${goalId}/entries` : null

  const { data, error, isLoading, mutate } = useSWR<SavingsEntriesResponse>(
    key,
    fetcher,
  )

  // Revalidate everything affected by savings entry mutations:
  // this goal's entries list, the goals list (for savedAmount),
  // the recent savings list, and the dashboard (for balance).
  const revalidateAll = async () => {
    await mutate()
    await globalMutate('/api/savings-goals')
    await globalMutate(
      (key) =>
        typeof key === 'string' && key.startsWith('/api/savings-entries/recent'),
    )
    router.refresh()
  }

  const createEntry = async (values: { amount: number; date: string }) => {
    if (!goalId) throw new Error('Missing goal id')

    const res = await fetch(`/api/savings-goals/${goalId}/entries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error ?? 'Failed to add funds')
    }

    await revalidateAll()
    return res.json()
  }

  const updateEntry = async (
    entryId: string,
    values: { amount?: number; date?: string },
  ) => {
    const res = await fetch(`/api/savings-entries/${entryId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error ?? 'Failed to update entry')
    }

    await revalidateAll()
    return res.json()
  }

  const deleteEntry = async (entryId: string) => {
    const res = await fetch(`/api/savings-entries/${entryId}`, {
      method: 'DELETE',
    })

    if (!res.ok && res.status !== 204) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error ?? 'Failed to delete entry')
    }

    await revalidateAll()
  }

  return {
    entries: data?.entries ?? [],
    isLoading,
    isError: Boolean(error),
    error,
    createEntry,
    updateEntry,
    deleteEntry,
    mutate,
  }
}
