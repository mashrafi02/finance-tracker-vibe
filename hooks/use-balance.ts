import useSWR from 'swr'
import { useRouter } from 'next/navigation'
import { fetcher } from '@/lib/utils'

export function useBalance() {
  const router = useRouter()

  const { data, error, isLoading, mutate } = useSWR<{ balance: number }>(
    '/api/accounts/balance',
    fetcher,
  )

  /**
   * Overwrite the user's account balance with an explicit value.
   * Called when the user manually sets their current funds
   * (e.g. initial setup, or updating after receiving a salary).
   * Income/expense transactions adjust the balance automatically —
   * this is only for manual corrections.
   */
  const updateBalance = async (balance: number): Promise<{ balance: number }> => {
    const res = await fetch('/api/accounts/balance', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ balance }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error ?? 'Failed to update balance')
    }

    // Optimistically update the SWR cache then re-render the server components
    // so that all SSR-rendered numbers (e.g. BalanceCard) reflect the new value.
    const json = (await res.json()) as { balance: number }
    await mutate({ balance: json.balance }, { revalidate: false })
    router.refresh()
    return json
  }

  return {
    balance: data?.balance ?? 0,
    isLoading,
    isError: Boolean(error),
    mutate,
    updateBalance,
  }
}
