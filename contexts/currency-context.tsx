'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { formatCurrency as formatCurrencyUtil } from '@/lib/utils'

export type Currency = 'USD' | 'BDT'

const STORAGE_KEY = 'finance-tracker:currency'

interface CurrencyContextValue {
  currency: Currency
  setCurrency: (c: Currency) => void
  formatCurrency: (amount: number | string) => string
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null)

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>('USD')

  // Read localStorage after mount to avoid SSR hydration mismatch.
  // setState is intentional here — we start with the server-safe default
  // ('USD') and update once the client environment is available.
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'USD' || stored === 'BDT') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrencyState(stored)
    }
  }, [])

  const setCurrency = useCallback((c: Currency) => {
    setCurrencyState(c)
    localStorage.setItem(STORAGE_KEY, c)
  }, [])

  const formatCurrency = useCallback(
    (amount: number | string) => formatCurrencyUtil(amount, currency),
    [currency],
  )

  // Stable identity — otherwise every ancestor re-render forces every
  // consumer of useCurrency() to re-render, even if the currency didn't
  // change.
  const value = useMemo(
    () => ({ currency, setCurrency, formatCurrency }),
    [currency, setCurrency, formatCurrency],
  )

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext)
  if (!ctx) throw new Error('useCurrency must be used within a CurrencyProvider')
  return ctx
}
