'use client'

import { useState } from 'react'
import useSWR from 'swr'
import {
  BarChart,
  Bar,
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
import { useCurrency } from '@/contexts/currency-context'

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
    color: 'var(--chart-3)',
  },
  expense: {
    label: 'Expenses',
    color: 'var(--chart-1)',
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
    return date.toLocaleDateString('en-US', { month: 'short' })
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function IncomeExpenseBarChart() {
  const { formatCurrency, currency } = useCurrency()
  const currencySymbol = currency === 'BDT' ? '৳' : '$'
  const [range, setRange] = useState<Range>('weekly')

  const { data, error, isLoading } = useSWR<SummaryResponse>(
    `/api/analytics/summary?range=${range}`,
    fetcher
  )

  const chartData = data?.data.map((item) => ({
    period: formatPeriodLabel(item.period, range),
    income: item.income,
    expense: item.expense,
  })) ?? []

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 pb-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <CardTitle className="text-base">Income vs. Expenses</CardTitle>
          <CardDescription className="text-xs">
            Summary of income and expenses over time
          </CardDescription>
        </div>
        <Select value={range} onValueChange={(value) => value && setRange(value as Range)}>
          <SelectTrigger className="h-9 w-full rounded-lg sm:w-[150px]">
            <SelectValue placeholder="Select range" />
          </SelectTrigger>
          <SelectContent className="p-2 h-26!">
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
        ) : chartData.length === 0 || chartData.every(d => d.income === 0 && d.expense === 0) ? (
          <div className="flex h-[300px] items-center justify-center">
            <p className="text-sm text-muted-foreground">
              No transaction data for {rangeLabels[range].toLowerCase()}.
            </p>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <BarChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="period"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                tickFormatter={(value) => `${currencySymbol}${value}`}
              />
              <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="income" fill="var(--chart-3)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="expense" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
