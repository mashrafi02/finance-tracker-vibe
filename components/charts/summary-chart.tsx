'use client'

import { useState } from 'react'
import useSWR from 'swr'
import {
  AreaChart,
  Area,
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
} from '@/components/ui/chart'
import { Skeleton } from '@/components/ui/skeleton'
import { cn, fetcher } from '@/lib/utils'

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
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
  }

  // For weekly and monthly, show short date format
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function SummaryChart() {
  const [range, setRange] = useState<Range>('weekly')

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
      <CardHeader className="flex flex-col gap-4 pb-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <CardTitle className="text-base">Cashflow</CardTitle>
          <CardDescription className="text-xs">
            Income vs expenses over time
          </CardDescription>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-4 sm:flex">
            <LegendDot className="bg-[var(--chart-1)]" label="Expenses" />
            <LegendDot className="bg-[var(--chart-3)]" label="Income" />
          </div>
          <Select value={range} onValueChange={(value) => value && setRange(value)}>
            <SelectTrigger className="h-9 w-full rounded-lg sm:w-[150px]">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Last 7 Days</SelectItem>
              <SelectItem value="monthly">Last 30 Days</SelectItem>
              <SelectItem value="yearly">Last 12 Months</SelectItem>
            </SelectContent>
          </Select>
        </div>
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
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 12, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-3)" stopOpacity={0.45} />
                  <stop offset="55%" stopColor="var(--chart-3)" stopOpacity={0.12} />
                  <stop offset="100%" stopColor="var(--chart-3)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.4} />
                  <stop offset="55%" stopColor="var(--chart-1)" stopOpacity={0.1} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="period"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                interval={range === 'monthly' ? 4 : range === 'yearly' ? 1 : 0}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
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
              <Area
                type="monotone"
                dataKey="Expenses"
                stroke="var(--chart-1)"
                strokeWidth={2.25}
                fill="url(#expenseFill)"
                fillOpacity={1}
                activeDot={{ r: 5, strokeWidth: 2, fill: 'var(--card)' }}
              />
              <Area
                type="monotone"
                dataKey="Income"
                stroke="var(--chart-3)"
                strokeWidth={2.25}
                fill="url(#incomeFill)"
                fillOpacity={1}
                activeDot={{ r: 5, strokeWidth: 2, fill: 'var(--card)' }}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
      <span className={cn('h-2 w-2 rounded-full', className)} />
      {label}
    </span>
  )
}
