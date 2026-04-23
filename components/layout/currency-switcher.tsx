'use client'

import { useCurrency, type Currency } from '@/contexts/currency-context'
import { cn } from '@/lib/utils'

const OPTIONS: { value: Currency; label: string }[] = [
  { value: 'USD', label: '$' },
  { value: 'BDT', label: '৳' },
]

export function CurrencySwitcher() {
  const { currency, setCurrency } = useCurrency()

  return (
    <div
      className="hidden items-center gap-0.5 rounded-xl border border-border bg-card p-1 shadow-card sm:inline-flex"
      role="group"
      aria-label="Select currency"
    >
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setCurrency(opt.value)}
          aria-pressed={currency === opt.value}
          aria-label={opt.value === 'USD' ? 'US Dollar' : 'Bangladeshi Taka'}
          className={cn(
            'h-7.5 min-w-[2rem] rounded-lg px-2.5 text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
            currency === opt.value
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
