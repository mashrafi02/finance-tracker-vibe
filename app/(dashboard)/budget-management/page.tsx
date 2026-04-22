'use client'

import { BudgetList } from '@/components/budgets/budget-list'
import { Reveal } from '@/components/ui/reveal'

export default function BudgetManagementPage() {
  return (
    <div className="space-y-6">
      <Reveal as="section">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-[28px]">
          Budget management
        </h2>
        <p className="mt-1 text-sm font-medium text-muted-foreground">
          Set monthly spending limits and income goals per category.
        </p>
      </Reveal>

      <Reveal delay={60}>
        <BudgetList />
      </Reveal>
    </div>
  )
}
