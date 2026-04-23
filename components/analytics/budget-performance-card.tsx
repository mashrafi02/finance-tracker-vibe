'use client'

import { Label, PolarAngleAxis, PolarRadiusAxis, RadialBar, RadialBarChart } from 'recharts'
import { Target } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, cn } from '@/lib/utils'

interface BudgetPerformanceCardProps {
  totalBudget: number
  totalSpent: number
  percentageUsed: number
  isLoading?: boolean
}

const chartConfig = {
  spent: { label: 'Spent', color: 'var(--chart-1)' },
} satisfies ChartConfig

interface StatRowProps {
  label: string
  value: string
  tone?: 'default' | 'danger' | 'success'
}

function StatRow({ label, value, tone = 'default' }: StatRowProps) {
  return (
    <div className="flex items-center justify-between px-3 py-2">
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      <p
        className={cn(
          'font-mono text-xs font-semibold tabular-nums',
          tone === 'danger' && 'text-rose-600 dark:text-rose-400',
          tone === 'success' && 'text-emerald-600 dark:text-emerald-400',
        )}
      >
        {value}
      </p>
    </div>
  )
}

export function BudgetPerformanceCard({
  totalBudget,
  totalSpent,
  percentageUsed,
  isLoading,
}: BudgetPerformanceCardProps) {
  const isOver = percentageUsed >= 100
  const isWarn = percentageUsed >= 80 && !isOver
  const remaining = Math.max(0, totalBudget - totalSpent)
  const displayPct = Math.min(percentageUsed, 100)

  const arcFill = isOver
    ? 'var(--destructive)'
    : isWarn
      ? 'hsl(43 96% 56%)'
      : 'var(--color-spent)'

  const chartData = [{ key: 'budget', value: displayPct, fill: arcFill }]

  const statusLabel = isOver ? 'Over budget' : isWarn ? 'Approaching limit' : 'On track'
  const statusToneClass = isOver
    ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
    : isWarn
      ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
      : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'

  const pctFillClass = isOver
    ? 'fill-rose-600 dark:fill-rose-400'
    : isWarn
      ? 'fill-amber-600 dark:fill-amber-400'
      : 'fill-foreground'

  return (
    <Card className="h-full w-full min-w-0 overflow-hidden">
      <CardContent className="flex h-full min-w-0 flex-col gap-5 p-5">
        {/* Header */}
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Target className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-none">Budget Performance</p>
            <p className="mt-1 text-[11px] font-medium text-muted-foreground">
              Spending vs limits · this month
            </p>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex flex-col items-center gap-4">
            <Skeleton className="h-40 w-40 rounded-full" />
            <div className="w-full space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        ) : totalBudget === 0 ? (
          <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-border py-10 text-center">
            <p className="text-xs font-medium text-muted-foreground">
              Set spending budgets to
              <br />
              track performance here.
            </p>
          </div>
        ) : (
          <>
            {/* Radial chart */}
            <div className="flex justify-center">
              <ChartContainer config={chartConfig} className="aspect-square h-40 w-40">
                <RadialBarChart
                  data={chartData}
                  startAngle={90}
                  endAngle={-270}
                  innerRadius={52}
                  outerRadius={70}
                >
                  <PolarAngleAxis
                    type="number"
                    domain={[0, 100]}
                    angleAxisId={0}
                    tick={false}
                  />
                  <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
                    <Label
                      position="center"
                      content={({ viewBox }) => {
                        if (!viewBox || !('cx' in viewBox)) return null
                        return (
                          <text
                            x={viewBox.cx}
                            y={viewBox.cy}
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy ?? 0) - 5}
                              className={cn(
                                'font-mono text-2xl font-semibold tabular-nums',
                                pctFillClass,
                              )}
                            >
                              {percentageUsed}%
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy ?? 0) + 14}
                              className="fill-muted-foreground text-[11px] font-medium"
                            >
                              used
                            </tspan>
                          </text>
                        )
                      }}
                    />
                  </PolarRadiusAxis>
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <RadialBar
                    dataKey="value"
                    cornerRadius={8}
                    background={{ fill: 'var(--muted)' }}
                    className="stroke-transparent"
                  />
                </RadialBarChart>
              </ChartContainer>
            </div>

            {/* Status + stat rows */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wide',
                    statusToneClass,
                  )}
                >
                  {statusLabel}
                </span>
              </div>
              <div className="divide-y divide-border rounded-xl border border-border/70 bg-muted/30">
                <StatRow label="Spent" value={formatCurrency(totalSpent)} />
                <StatRow label="Budget" value={formatCurrency(totalBudget)} />
                <StatRow
                  label={isOver ? 'Over by' : 'Remaining'}
                  value={formatCurrency(isOver ? totalSpent - totalBudget : remaining)}
                  tone={isOver ? 'danger' : 'success'}
                />
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
