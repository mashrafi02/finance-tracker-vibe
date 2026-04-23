'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
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
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, fetcher } from '@/lib/utils'

type Range = '7d' | '30d' | '90d' | '365d' | 'all'

interface SavingsGrowthPoint {
  date: string
  cumulativeSavings: number
}

interface OverviewResponse {
  savingsGrowth: SavingsGrowthPoint[]
}

const RANGE_LABELS: Record<Range, string> = {
  '7d': 'Last 7 Days',
  '30d': 'Last 30 Days',
  '90d': 'Last 90 Days',
  '365d': 'Last 12 Months',
  all: 'All Time',
}

const chartConfig = {
  cumulativeSavings: {
    label: 'Total Savings',
    color: 'var(--chart-3)',
  },
} satisfies ChartConfig

/** Parse "YYYY-MM-DD" as a local date to avoid UTC timezone shifts. */
function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function toDateStr(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Fill every calendar day in the range with its cumulative savings value,
 * carrying the last known value forward so the X-axis spans the full period.
 */
function fillDateRange(
  data: SavingsGrowthPoint[],
  range: Range,
): { date: string; cumulativeSavings: number }[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let startDate: Date
  if (range === '7d') {
    startDate = new Date(today)
    startDate.setDate(today.getDate() - 6)
  } else if (range === '30d') {
    startDate = new Date(today)
    startDate.setDate(today.getDate() - 29)
  } else if (range === '90d') {
    startDate = new Date(today)
    startDate.setDate(today.getDate() - 89)
  } else if (range === '365d') {
    startDate = new Date(today)
    startDate.setDate(today.getDate() - 364)
  } else {
    // 'all' — start from the earliest entry, or today if no data
    startDate = data.length > 0 ? parseLocalDate(data[0].date) : today
  }

  const lookup = new Map<string, number>()
  for (const point of data) {
    lookup.set(point.date, point.cumulativeSavings)
  }

  const result: { date: string; cumulativeSavings: number }[] = []
  let lastValue = 0
  const cursor = new Date(startDate)

  while (cursor <= today) {
    const key = toDateStr(cursor)
    if (lookup.has(key)) lastValue = lookup.get(key)!
    result.push({ date: key, cumulativeSavings: lastValue })
    cursor.setDate(cursor.getDate() + 1)
  }

  return result
}

function formatDateLabel(dateStr: string, range: Range): string {
  const date = parseLocalDate(dateStr)
  if (range === '365d' || range === 'all') {
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatYAxis(v: number): string {
  const abs = Math.abs(v)
  if (abs >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `$${(v / 1_000).toFixed(0)}k`
  return `$${v.toFixed(0)}`
}

export function SavingsGrowthChart() {
  const [range, setRange] = useState<Range>('90d')

  const { data: response, isLoading } = useSWR<OverviewResponse>(
    `/api/analytics/overview?range=${range}`,
    fetcher,
  )

  const rawData = response?.savingsGrowth ?? []

  // Fill every day so the axis always spans the full selected period
  const filled = fillDateRange(rawData, range)

  const chartData = filled.map((point) => ({
    date: formatDateLabel(point.date, range),
    cumulativeSavings: point.cumulativeSavings,
  }))

  const tickInterval = Math.max(0, Math.ceil(chartData.length / 8) - 1)

  return (
    <Card className="h-full w-full min-w-0 overflow-hidden">
      <CardHeader className="flex flex-col gap-3 pb-2 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <CardTitle className="text-base">Savings Growth</CardTitle>
          <CardDescription className="text-xs">
            Cumulative total savings over the selected period
          </CardDescription>
        </div>
        <Select value={range} onValueChange={(v) => v && setRange(v as Range)}>
          <SelectTrigger className="h-9 w-full sm:w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.entries(RANGE_LABELS) as [Range, string][]).map(([v, label]) => (
              <SelectItem key={v} value={v}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="pb-5">
        {isLoading ? (
          <Skeleton className="h-[280px] w-full rounded-xl" />
        ) : chartData.length === 0 || chartData.every((p) => p.cumulativeSavings === 0) ? (
          <div className="flex h-[280px] items-center justify-center rounded-xl border border-dashed border-border">
            <p className="text-sm text-muted-foreground">
              No savings activity in this period.
            </p>
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[280px] w-full"
          >
            <AreaChart
              data={chartData}
              margin={{ left: 0, right: 4, top: 4, bottom: 0 }}
            >
              <defs>
                <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-3)" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="var(--chart-3)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                vertical={false}
                stroke="var(--border)"
                strokeDasharray="3 3"
                strokeOpacity={0.6}
              />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                interval={tickInterval}
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                tickMargin={8}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                tickFormatter={formatYAxis}
                width={52}
              />
              <ChartTooltip
                cursor={{ stroke: 'var(--border)', strokeWidth: 1 }}
                content={
                  <ChartTooltipContent
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="cumulativeSavings"
                stroke="var(--chart-3)"
                strokeWidth={2}
                fill="url(#savingsGradient)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2 }}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
