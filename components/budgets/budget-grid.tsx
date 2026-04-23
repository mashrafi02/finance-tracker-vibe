'use client'

import { Reveal } from '@/components/ui/reveal'
import { type BudgetStatus } from '@/hooks/use-budgets'
import { BudgetCard, EmptyBudgetSlot } from './budget-card'

interface BudgetGridProps {
  budgets: BudgetStatus[]
  onEdit: (budget: BudgetStatus) => void
  onDelete: (budget: BudgetStatus) => void
  onCreate: (budget: BudgetStatus) => void
  onAddFunds?: (budget: BudgetStatus) => void
  /** When true, the card is rendered in compact slot mode (no budget set). */
  variant?: 'active' | 'slot'
}

export function BudgetGrid({
  budgets,
  onEdit,
  onDelete,
  onCreate,
  onAddFunds,
  variant = 'active',
}: BudgetGridProps) {
  if (budgets.length === 0) return null

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {budgets.map((budget, i) => (
        <Reveal key={budget.categoryId} delay={i * 30} className="min-w-0">
          {variant === 'slot' ? (
            <EmptyBudgetSlot budget={budget} onCreate={onCreate} />
          ) : (
            <BudgetCard
              budget={budget}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddFunds={onAddFunds}
            />
          )}
        </Reveal>
      ))}
    </div>
  )
}
