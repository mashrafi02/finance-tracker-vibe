'use client'

import { SavingsGoalsGrid } from '@/components/savings/savings-goals-grid'
import { RecentSavingsCard } from '@/components/savings/recent-savings-card'
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

      <div className="grid gap-5 lg:grid-cols-3">
        <Reveal delay={60} className="space-y-5 lg:col-span-2">
          <SavingsGoalsGrid />
        </Reveal>

        <Reveal
          delay={120}
          className="lg:sticky lg:top-20 lg:col-span-1 lg:self-start lg:max-h-[calc(100vh-6rem)]"
        >
          <RecentSavingsCard />
        </Reveal>
      </div>
    </div>
  )
}
