import useSWR from 'swr'
import { fetcher } from '@/lib/utils'

export interface TransactionWithCategory {
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

export interface TransactionsResponse {
  data: TransactionWithCategory[]
  meta: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

interface UseTransactionsParams {
  page?: number
  pageSize?: number
  sort?: string
  from?: string
  to?: string
  type?: 'INCOME' | 'EXPENSE'
  categoryId?: string
  description?: string
}

export function useTransactions(params: UseTransactionsParams = {}) {
  const searchParams = new URLSearchParams()
  if (params.page) searchParams.set('page', String(params.page))
  if (params.pageSize) searchParams.set('pageSize', String(params.pageSize))
  if (params.sort) searchParams.set('sort', params.sort)
  if (params.from) searchParams.set('from', params.from)
  if (params.to) searchParams.set('to', params.to)
  if (params.type) searchParams.set('type', params.type)
  if (params.categoryId) searchParams.set('categoryId', params.categoryId)
  if (params.description) searchParams.set('description', params.description)

  const queryString = searchParams.toString()
  const key = `/api/transactions${queryString ? `?${queryString}` : ''}`

  const { data, error, isLoading, mutate } = useSWR<TransactionsResponse>(
    key,
    fetcher
  )

  return {
    transactions: data?.data ?? [],
    meta: data?.meta ?? { page: 1, pageSize: 10, total: 0, totalPages: 0 },
    isLoading,
    isError: Boolean(error),
    mutate,
  }
}
