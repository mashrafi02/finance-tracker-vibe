import { ReportsTable } from '@/components/reports/reports-table'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Reveal } from '@/components/ui/reveal'

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <Reveal as="section">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-[28px]">
          Reports
        </h2>
        <p className="mt-1 text-sm font-medium text-muted-foreground">
          Review your financial history month by month and export detailed reports.
        </p>
      </Reveal>

      <Reveal delay={60}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Monthly reports</CardTitle>
            <CardDescription className="text-xs">
              Reports are generated automatically at the end of each month. You can also generate one for the current month anytime.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ReportsTable />
          </CardContent>
        </Card>
      </Reveal>
    </div>
  )
}
