import { IncomeExpenseBarChart } from '@/components/charts/income-expense-bar-chart'
import { SpendingByCategoryChart } from '@/components/charts/spending-by-category-chart'
import { BarChart3 } from 'lucide-react'
import { Reveal } from '@/components/ui/reveal'

export default function AnalyticsPage() {
  return (
    <div className="space-y-7">
      <Reveal
        as="section"
        className="rounded-3xl border border-border/70 bg-card px-6 py-7 shadow-[0_12px_34px_rgba(0,0,0,0.04)] sm:px-8"
      >
        <div className="flex items-start gap-4">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <BarChart3 className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Analytics</h1>
            <p className="mt-1 text-sm font-medium text-muted-foreground">
              Visualize your financial data with interactive charts.
            </p>
          </div>
        </div>
      </Reveal>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Reveal delay={80}>
          <SpendingByCategoryChart />
        </Reveal>
        <Reveal delay={160}>
          <IncomeExpenseBarChart />
        </Reveal>
      </div>
    </div>
  )
}
