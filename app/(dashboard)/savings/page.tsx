'use client'

import { SavingsGoalsGrid } from '@/components/savings/savings-goals-grid'
import { Reveal } from '@/components/ui/reveal'

export default function SavingsPage() {
  return (
    <div className="space-y-6">
      <Reveal as="section">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-[28px]">
          Savings goals
        </h2>
        <p className="mt-1 text-sm font-medium text-muted-foreground">
          Create goals, add contributions, and track your progress over time.
        </p>
      </Reveal>

      <Reveal delay={60} className="space-y-5">
        <SavingsGoalsGrid />
      </Reveal>
    </div>
  )
}
