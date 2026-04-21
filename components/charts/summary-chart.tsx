'use client'

import { useState } from 'react'
import useSWR from 'swr'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import { Skeleton } from '@/components/ui/skeleton'
import { fetcher } from '@/lib/utils'

type Range = 'weekly' | 'monthly' | 'yearly'

interface SummaryData {
  period: string
  income: number
  expense: number
}

interface SummaryResponse {
  range: Range
  data: SummaryData[]
}

const chartConfig = {
  income: {
    label: 'Income',
    color: 'hsl(158, 64%, 42%)',
  },
  expense: {
    label: 'Expenses',
    color: 'hsl(356, 71%, 56%)',
  },
} satisfies ChartConfig

const rangeLabels: Record<Range, string> = {
  weekly: 'Last 7 Days',
  monthly: 'Last 30 Days',
  yearly: 'Last 12 Months',
}

function formatPeriodLabel(period: string, range: Range): string {
  const date = new Date(period)

  if (range === 'yearly') {
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
  }

  // For weekly and monthly, show short date format
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function SummaryChart() {
  const [range, setRange] = useState<Range>('monthly')

  const { data, error, isLoading } = useSWR<SummaryResponse>(
    `/api/summary?range=${range}`,
    fetcher
  )

  // Transform data for the chart
  const chartData = data?.data.map((item) => ({
    period: formatPeriodLabel(item.period, range),
    Income: item.income,
    Expenses: item.expense,
  })) ?? []

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 pb-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <CardTitle>Income vs Expenses</CardTitle>
          <CardDescription>
            Track your financial activity over time
          </CardDescription>
        </div>
        <Select value={range} onValueChange={(value) => value && setRange(value)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Select range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="weekly">Last 7 Days</SelectItem>
            <SelectItem value="monthly">Last 30 Days</SelectItem>
            <SelectItem value="yearly">Last 12 Months</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-[300px] items-center justify-center">
            <Skeleton className="h-[280px] w-full" />
          </div>
        ) : error ? (
          <div className="flex h-[300px] items-center justify-center">
            <p className="text-sm text-muted-foreground">
              Failed to load chart data. Please try again.
            </p>
          </div>
        ) : chartData.length === 0 || chartData.every(d => d.Income === 0 && d.Expenses === 0) ? (
          <div className="flex h-[300px] items-center justify-center">
            <p className="text-sm text-muted-foreground">
              No transaction data for {rangeLabels[range].toLowerCase()}.
            </p>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[300px] w-full rounded-2xl bg-muted/15 p-2">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="period"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 12 }}
                interval={range === 'monthly' ? 4 : range === 'yearly' ? 1 : 0}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `$${value}`}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => (
                      <span>
                        {name}: ${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    )}
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Line
                type="monotone"
                dataKey="Income"
                stroke="var(--color-income)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="Expenses"
                stroke="var(--color-expense)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
