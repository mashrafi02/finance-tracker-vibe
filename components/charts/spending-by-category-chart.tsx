'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { PieChart, Pie, Cell } from 'recharts'
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

type Range = 'weekly' | 'monthly'

interface SpendingData {
  name: string
  value: number
  color: string
}

interface SpendingResponse {
  range: Range
  data: SpendingData[]
}

const rangeLabels: Record<Range, string> = {
  weekly: 'Last 7 Days',
  monthly: 'Last 30 Days',
}

export function SpendingByCategoryChart() {
  const [range, setRange] = useState<Range>('monthly')

  const { data, error, isLoading } = useSWR<SpendingResponse>(
    `/api/analytics/spending?range=${range}`,
    fetcher
  )

  const chartData = data?.data ?? []

  const chartConfig = chartData.reduce((acc, item) => {
    acc[item.name] = { label: item.name, color: item.color }
    return acc
  }, {} as ChartConfig)

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 pb-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <CardTitle className="text-base">Spending by Category</CardTitle>
          <CardDescription className="text-xs">
            A breakdown of your expenses by category
          </CardDescription>
        </div>
        <Select value={range} onValueChange={(value) => value && setRange(value as Range)}>
          <SelectTrigger className="h-9 w-full rounded-lg sm:w-[150px]">
            <SelectValue placeholder="Select range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="weekly">Last 7 Days</SelectItem>
            <SelectItem value="monthly">Last 30 Days</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-[300px] items-center justify-center">
            <Skeleton className="h-[250px] w-[250px] rounded-full" />
          </div>
        ) : error ? (
          <div className="flex h-[300px] items-center justify-center">
            <p className="text-sm text-muted-foreground">
              Failed to load chart data. Please try again.
            </p>
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex h-[300px] items-center justify-center">
            <p className="text-sm text-muted-foreground">
              No spending data for {rangeLabels[range].toLowerCase()}.
            </p>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <PieChart>
              <ChartTooltip
                content={<ChartTooltipContent nameKey="name" hideLabel />}
              />
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
              >
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <ChartLegend
                content={<ChartLegendContent nameKey="name" />}
                className="-translate-y-2"
              />
            </PieChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
