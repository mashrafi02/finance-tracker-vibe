'use client'

import { useState } from 'react'
import { Plus, Target, MoreHorizontal, Pencil, Trash2, Wallet, ListOrdered } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button, buttonVariants } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useSavingsGoals, type SavingsGoal } from '@/hooks/use-savings-goals'
import { cn } from '@/lib/utils'
import { useCurrency } from '@/contexts/currency-context'
import { SavingsGoalSheet } from './savings-goal-sheet'
import { DeleteSavingsGoalDialog } from './delete-savings-goal-dialog'
import { AddFundsDialog } from './add-funds-dialog'
import { EntriesSheet } from './entries-sheet'

const TONES = [
  {
    surface: 'from-blue-50/60 to-transparent dark:from-blue-500/10',
    indicator: '[&_[data-slot=progress-indicator]]:bg-blue-500',
    icon: 'bg-blue-500/15 text-blue-600 dark:text-blue-300',
    chip: 'text-blue-700 dark:text-blue-300',
  },
  {
    surface: 'from-amber-50/60 to-transparent dark:from-amber-500/10',
    indicator: '[&_[data-slot=progress-indicator]]:bg-amber-500',
    icon: 'bg-amber-500/15 text-amber-600 dark:text-amber-300',
    chip: 'text-amber-700 dark:text-amber-300',
  },
  {
    surface: 'from-emerald-50/60 to-transparent dark:from-emerald-500/10',
    indicator: '[&_[data-slot=progress-indicator]]:bg-emerald-500',
    icon: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300',
    chip: 'text-emerald-700 dark:text-emerald-300',
  },
  {
    surface: 'from-violet-50/60 to-transparent dark:from-violet-500/10',
    indicator: '[&_[data-slot=progress-indicator]]:bg-violet-500',
    icon: 'bg-violet-500/15 text-violet-600 dark:text-violet-300',
    chip: 'text-violet-700 dark:text-violet-300',
  },
]

function toneFor(index: number) {
  return TONES[index % TONES.length]
}

interface GoalCardProps {
  goal: SavingsGoal
  index: number
  onAddFunds: (goal: SavingsGoal) => void
  onEdit: (goal: SavingsGoal) => void
  onDelete: (goal: SavingsGoal) => void
  onViewEntries: (goal: SavingsGoal) => void
}

function GoalCard({
  goal,
  index,
  onAddFunds,
  onEdit,
  onDelete,
  onViewEntries,
}: GoalCardProps) {
  const { formatCurrency } = useCurrency()
  const target = Number(goal.targetAmount)
  const saved = Number(goal.savedAmount)
  const pct = target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0
  const remaining = Math.max(0, target - saved)
  const tone = toneFor(index)

  return (
    <Card className="relative overflow-hidden">
      <div
        className={cn(
          'pointer-events-none absolute inset-0 bg-gradient-to-br',
          tone.surface,
        )}
        aria-hidden
      />
      <CardContent className="relative flex flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              className={cn(
                'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                tone.icon,
              )}
            >
              <Target className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-tight">
                {goal.name}
              </p>
              <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">
                Target: {formatCurrency(target)}
              </p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Goal actions"
              className={cn(
                buttonVariants({ variant: 'ghost', size: 'icon' }),
                'h-8 w-8',
              )}
            >
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onViewEntries(goal)}>
                <ListOrdered className="mr-2 h-4 w-4" />
                View entries
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(goal)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(goal)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div>
          <div className="flex items-baseline justify-between gap-3">
            <p className="font-mono text-2xl font-semibold tabular-nums">
              {formatCurrency(saved)}
            </p>
            <span
              className={cn(
                'rounded-full bg-background/70 px-2 py-0.5 text-[11px] font-semibold tabular-nums backdrop-blur-sm',
                tone.chip,
              )}
            >
              {pct}%
            </span>
          </div>
          <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">
            {remaining > 0
              ? <>{formatCurrency(remaining)} to go</>
              : 'Goal reached 🎉'}
          </p>
        </div>

        <Progress
          value={pct}
          className={cn('[&>div]:bg-background/40', tone.indicator)}
        />

        <div className="mt-1 flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            onClick={() => onAddFunds(goal)}
            className="gap-1"
          >
            <Plus className="h-3.5 w-3.5" />
            Add funds
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onViewEntries(goal)}
            className="gap-1"
          >
            <Wallet className="h-3.5 w-3.5" />
            History
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function SavingsGoalsGrid() {
  const { formatCurrency } = useCurrency()
  const { goals, isLoading, isError } = useSavingsGoals()

  const [goalSheetOpen, setGoalSheetOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null)
  const [deletingGoal, setDeletingGoal] = useState<SavingsGoal | null>(null)
  const [fundingGoal, setFundingGoal] = useState<SavingsGoal | null>(null)
  const [entriesGoal, setEntriesGoal] = useState<SavingsGoal | null>(null)

  // Keep the live goal in sync once SWR revalidates (e.g. after adding funds).
  const liveEntriesGoal = entriesGoal
    ? goals.find((g) => g.id === entriesGoal.id) ?? entriesGoal
    : null
  const liveFundingGoal = fundingGoal
    ? goals.find((g) => g.id === fundingGoal.id) ?? fundingGoal
    : null

  const totalSaved = goals.reduce((a, g) => a + Number(g.savedAmount), 0)
  const totalTarget = goals.reduce((a, g) => a + Number(g.targetAmount), 0)
  const overallPct =
    totalTarget > 0
      ? Math.min(100, Math.round((totalSaved / totalTarget) * 100))
      : 0

  const openCreateSheet = () => {
    setEditingGoal(null)
    setGoalSheetOpen(true)
  }
  const openEditSheet = (goal: SavingsGoal) => {
    setEditingGoal(goal)
    setGoalSheetOpen(true)
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[220px] rounded-2xl" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="p-10 text-center">
          <p className="text-sm text-muted-foreground">
            Failed to load savings goals. Please refresh the page.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (goals.length === 0) {
    return (
      <>
        <Card>
          <CardContent className="p-10">
            <EmptyState
              icon={<Target />}
              title="No savings goals yet"
              description="Create your first goal to track progress toward something meaningful."
              action={
                <Button onClick={openCreateSheet} className="gap-1">
                  <Plus className="h-3.5 w-3.5" />
                  New savings goal
                </Button>
              }
              className="border-0 bg-transparent"
            />
          </CardContent>
        </Card>

        <SavingsGoalSheet
          open={goalSheetOpen}
          onOpenChange={(o) => {
            setGoalSheetOpen(o)
            if (!o) setEditingGoal(null)
          }}
          goal={editingGoal ?? undefined}
        />
      </>
    )
  }

  return (
    <>
      {/* Summary + New button row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <Target className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Combined savings
              </p>
              <p className="font-mono text-xl font-semibold tabular-nums">
                {formatCurrency(totalSaved)}
                <span className="ml-1 text-sm font-medium text-muted-foreground">
                  / {formatCurrency(totalTarget)}
                </span>
              </p>
            </div>
          </div>
          <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold tabular-nums text-emerald-700 dark:text-emerald-300">
            {overallPct}%
          </span>
        </div>

        <Button onClick={openCreateSheet} className="gap-1">
          <Plus className="h-4 w-4" />
          New goal
        </Button>
      </div>

      {/* Goals grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {goals.map((goal, i) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            index={i}
            onAddFunds={setFundingGoal}
            onEdit={openEditSheet}
            onDelete={setDeletingGoal}
            onViewEntries={setEntriesGoal}
          />
        ))}
      </div>

      {/* Dialogs / sheets */}
      <SavingsGoalSheet
        open={goalSheetOpen}
        onOpenChange={(o) => {
          setGoalSheetOpen(o)
          if (!o) setEditingGoal(null)
        }}
        goal={editingGoal ?? undefined}
      />

      <DeleteSavingsGoalDialog
        goal={deletingGoal}
        open={Boolean(deletingGoal)}
        onOpenChange={(o) => !o && setDeletingGoal(null)}
      />

      <AddFundsDialog
        goal={liveFundingGoal}
        open={Boolean(fundingGoal)}
        onOpenChange={(o) => !o && setFundingGoal(null)}
      />

      <EntriesSheet
        goal={liveEntriesGoal}
        open={Boolean(entriesGoal)}
        onOpenChange={(o) => !o && setEntriesGoal(null)}
      />
    </>
  )
}
