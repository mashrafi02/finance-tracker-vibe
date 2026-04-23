'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Plus, Target } from 'lucide-react'
import { Bar, BarChart, XAxis, YAxis, Cell } from 'recharts'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { useSavingsGoals, type SavingsGoal } from '@/hooks/use-savings-goals'
import { cn } from '@/lib/utils'
import { useCurrency } from '@/contexts/currency-context'
import { NewSavingsGoalDialog } from './new-savings-goal-dialog'

// Rotating tint palette so each goal card has its own accent.
const TONES = [
  {
    surface: 'bg-blue-50 dark:bg-blue-500/10 border-blue-200/60 dark:border-blue-500/20',
    bar: '#3b82f6',
    track: 'rgba(59, 130, 246, 0.18)',
    label: 'text-blue-700 dark:text-blue-300',
  },
  {
    surface: 'bg-amber-50 dark:bg-amber-500/10 border-amber-200/60 dark:border-amber-500/20',
    bar: '#f59e0b',
    track: 'rgba(245, 158, 11, 0.18)',
    label: 'text-amber-700 dark:text-amber-300',
  },
  {
    surface: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200/60 dark:border-emerald-500/20',
    bar: '#10b981',
    track: 'rgba(16, 185, 129, 0.18)',
    label: 'text-emerald-700 dark:text-emerald-300',
  },
  {
    surface: 'bg-violet-50 dark:bg-violet-500/10 border-violet-200/60 dark:border-violet-500/20',
    bar: '#8b5cf6',
    track: 'rgba(139, 92, 246, 0.18)',
    label: 'text-violet-700 dark:text-violet-300',
  },
]

function toneFor(index: number) {
  return TONES[index % TONES.length]
}

function GoalTile({ goal, index }: { goal: SavingsGoal; index: number }) {
  const { formatCurrency } = useCurrency()
  const target = Number(goal.targetAmount)
  const saved = Number(goal.savedAmount)
  const pct = target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0
  const remaining = Math.max(0, target - saved)
  const tone = toneFor(index)

  const chartData = [
    {
      name: 'progress',
      saved: Math.min(saved, target || saved),
      remaining,
    },
  ]

  const chartConfig = {
    saved: { label: 'Saved', color: tone.bar },
    remaining: { label: 'Remaining', color: tone.track },
  } satisfies ChartConfig

  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-xl border p-4 transition-colors',
        tone.surface,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-tight">
            {goal.name}
          </p>
          <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">
            Target: {formatCurrency(target)}
          </p>
        </div>
        <span
          className={cn(
            'shrink-0 rounded-full bg-background/60 px-2 py-0.5 text-[10px] font-semibold tabular-nums backdrop-blur-sm',
            tone.label,
          )}
        >
          {pct}%
        </span>
      </div>

      <p className="font-mono text-lg font-semibold tabular-nums">
        {formatCurrency(saved)}
      </p>

      <ChartContainer config={chartConfig} className="h-6 w-full">
        <BarChart
          accessibilityLayer
          layout="vertical"
          data={chartData}
          margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
          barCategoryGap={0}
        >
          <XAxis type="number" hide domain={[0, target || saved || 1]} />
          <YAxis type="category" dataKey="name" hide />
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                hideLabel
                formatter={(value, name) => (
                  <div className="flex w-full justify-between gap-3">
                    <span className="capitalize text-muted-foreground">
                      {name}
                    </span>
                    <span className="font-mono font-semibold tabular-nums">
                      {formatCurrency(Number(value))}
                    </span>
                  </div>
                )}
              />
            }
          />
          <Bar
            dataKey="saved"
            stackId="a"
            radius={[6, 0, 0, 6]}
            isAnimationActive={false}
          >
            <Cell fill={tone.bar} />
          </Bar>
          <Bar
            dataKey="remaining"
            stackId="a"
            radius={[0, 6, 6, 0]}
            isAnimationActive={false}
          >
            <Cell fill={tone.track} />
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  )
}

export function SavingsCard() {
  const { formatCurrency } = useCurrency()
  const [dialogOpen, setDialogOpen] = useState(false)
  const { goals, isLoading, isError } = useSavingsGoals()

  const totalSaved = goals.reduce((acc, g) => acc + Number(g.savedAmount), 0)
  const totalTarget = goals.reduce((acc, g) => acc + Number(g.targetAmount), 0)
  const overallPct =
    totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : 0

  return (
    <Card className="w-full min-w-0 overflow-hidden">
      <CardContent className="flex h-full min-w-0 flex-col p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <Target className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-sm font-semibold">Savings</h3>
              <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">
                {goals.length === 0
                  ? 'Set goals to stay on track'
                  : `${goals.length} goal${goals.length === 1 ? '' : 's'}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {goals.length > 0 && (
              <>
                <div className="hidden text-right sm:block">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Saved
                  </p>
                  <p className="font-mono text-sm font-semibold tabular-nums">
                    {formatCurrency(totalSaved)}
                  </p>
                </div>
                <Button asChild size="sm" variant="ghost" className="gap-1">
                  <Link href="/savings">
                    See all
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="mt-5">
          {isLoading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-[120px] rounded-xl" />
              ))}
            </div>
          ) : isError ? (
            <p className="py-6 text-center text-xs text-muted-foreground">
              Failed to load savings goals.
            </p>
          ) : goals.length === 0 ? (
            <EmptyState
              icon={<Target />}
              title="No savings goals yet"
              description="Create your first goal to track progress toward something specific."
              action={
                <Button onClick={() => setDialogOpen(true)} className="gap-1">
                  <Plus className="h-3.5 w-3.5" />
                  Create goal
                </Button>
              }
              className="py-6"
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {goals.slice(0, 3).map((goal, i) => (
                <GoalTile key={goal.id} goal={goal} index={i} />
              ))}
            </div>
          )}
        </div>
      </CardContent>

      <NewSavingsGoalDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </Card>
  )
}
