import { IncomeExpenseBarChart } from '@/components/charts/income-expense-bar-chart'
import { SpendingByCategoryChart } from '@/components/charts/spending-by-category-chart'
import { Reveal } from '@/components/ui/reveal'

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <Reveal as="section">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-[28px]">Analytics</h2>
        <p className="mt-1 text-sm font-medium text-muted-foreground">
          Visualize your financial data with interactive charts.
        </p>
      </Reveal>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Reveal delay={60}>
          <SpendingByCategoryChart />
        </Reveal>
        <Reveal delay={120}>
          <IncomeExpenseBarChart />
        </Reveal>
      </div>
    </div>
  )
}
