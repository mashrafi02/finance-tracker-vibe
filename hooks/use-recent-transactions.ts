import useSWR from 'swr'
import { fetcher } from '@/lib/utils'

export interface RecentTransaction {
  id: string
  amount: string
  type: 'INCOME' | 'EXPENSE'
  description: string
  date: string
  createdAt: string
  category: {
    id: string
    name: string
    color: string
    icon: string
  }
}

interface RecentTransactionsResponse {
  transactions: RecentTransaction[]
}

export function useRecentTransactions(limit = 5) {
  const key = `/api/transactions/recent?limit=${limit}`

  const { data, error, isLoading, mutate } = useSWR<RecentTransactionsResponse>(
    key,
    fetcher,
  )

  return {
    transactions: data?.transactions ?? [],
    isLoading,
    isError: Boolean(error),
    error,
    mutate,
  }
}
