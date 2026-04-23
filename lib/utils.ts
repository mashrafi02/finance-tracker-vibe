import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(
  amount: number | string,
  currency: 'USD' | 'BDT' = 'USD',
): string {
  const num = Number(amount)
  if (currency === 'BDT') {
    return (
      '৳ ' +
      new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(num)
    )
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(num)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}

export const fetcher = async (url: string) => {
  // cache: 'no-store' ensures SWR mutation-triggered revalidations always
  // receive fresh data from the server. Without this, the browser's HTTP
  // cache (e.g. Cache-Control: max-age=15 on /api/savings-goals) intercepts
  // re-fetches and returns stale pre-mutation data, causing cards to appear
  // frozen until a full page reload. SWR manages its own in-memory
  // deduplication, so bypassing the browser cache has no downside here.
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) {
    const error = await res.json().catch(() => ({}))
    throw new Error(error.error ?? 'Request failed')
  }
  return res.json()
}
