'use client'

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

interface SpendingData {
  name: string
  value: number
  color: string
}

interface SpendingResponse {
  range: string
  data: SpendingData[]
}

export function SpendingByCategoryChart() {
  const { formatCurrency } = useCurrency()
  const { data, error, isLoading } = useSWR<SpendingResponse>(
    `/api/analytics/spending?range=monthly`,
    fetcher
  )

  const chartData = data?.data ?? []

  const chartConfig = chartData.reduce((acc, item) => {
    acc[item.name] = { label: item.name, color: item.color }
    return acc
  }, {} as ChartConfig)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Spending by Category</CardTitle>
        <CardDescription className="text-xs">
          A breakdown of your expenses over the last 30 days
        </CardDescription>
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
              No spending data for the last 30 days.
            </p>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <PieChart>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    nameKey="name"
                    hideLabel
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                }
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
