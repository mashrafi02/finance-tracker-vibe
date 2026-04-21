import useSWR from 'swr'
import { fetcher } from '@/lib/utils'
import type { Category } from '@/db/schema'

export function useCategories() {
  const { data, error, isLoading, mutate } = useSWR<Category[]>(
    '/api/categories',
    fetcher
  )

  return {
    categories: data ?? [],
    isLoading,
    isError: Boolean(error),
    mutate,
  }
}
