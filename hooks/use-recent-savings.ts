import useSWR from 'swr'
import { fetcher } from '@/lib/utils'

export interface RecentSavingsEntry {
  id: string
  amount: string
  date: string
  createdAt: string
  goal: {
    id: string
    name: string
  }
}

interface RecentSavingsResponse {
  entries: RecentSavingsEntry[]
}

export function useRecentSavings(limit = 5) {
  const key = `/api/savings-entries/recent?limit=${limit}`

  const { data, error, isLoading, mutate } = useSWR<RecentSavingsResponse>(
    key,
    fetcher,
  )

  return {
    entries: data?.entries ?? [],
    isLoading,
    isError: Boolean(error),
    mutate,
  }
}
