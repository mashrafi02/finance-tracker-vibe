'use client'

import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Reveal } from '@/components/ui/reveal'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

import { OverspentBudgetAlert } from '@/components/budgets/overspent-budget-alert'
import { AddFundsDialog } from '@/components/budgets/add-funds-dialog'
import { BudgetSheet } from '@/components/budgets/budget-sheet'
import { BudgetGrid } from '@/components/budgets/budget-grid'
import { BudgetSummaryCard } from '@/components/budgets/budget-summary-card'

import {
  useBudgets,
  type BudgetStatus,
  type BudgetType,
} from '@/hooks/use-budgets'

function getMonthOptions() {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  const cur = `${y}-${String(m + 1).padStart(2, '0')}`
  let ny = y
  let nm = m + 1
  if (nm > 11) {
    ny += 1
    nm = 0
  }
  const next = `${ny}-${String(nm + 1).padStart(2, '0')}`
  const fmt = (s: string) => {
    const [yy, mm] = s.split('-')
    return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(
      new Date(parseInt(yy), parseInt(mm) - 1),
    )
  }
  return [
    { value: cur, label: fmt(cur) },
    { value: next, label: fmt(next) },
  ]
}

export default function BudgetManagementPage() {
  const monthOptions = useMemo(() => getMonthOptions(), [])
  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0].value)

  const {
    spendingBudgets,
    incomeGoals,
    isLoading,
    deleteBudget,
  } = useBudgets(selectedMonth)

  // Sheet (create / edit)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [sheetTarget, setSheetTarget] = useState<BudgetStatus | null>(null)
  const [sheetDefaultType, setSheetDefaultType] =
    useState<BudgetType>('SPENDING')

  // Add funds
  const [fundsTarget, setFundsTarget] = useState<BudgetStatus | null>(null)
  const [fundsOpen, setFundsOpen] = useState(false)

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<BudgetStatus | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Partition budgets
  const activeSpending = spendingBudgets.filter((b) => b.limit !== null)
  const slotsSpending = spendingBudgets.filter((b) => b.limit === null)
  const activeGoals = incomeGoals.filter((b) => b.limit !== null)
  const slotsGoals = incomeGoals.filter((b) => b.limit === null)

  // Handlers
  function openCreate(type: BudgetType, fromCategory?: BudgetStatus) {
    setSheetDefaultType(type)
    if (fromCategory) {
      // Pre-select category by treating it as a "create" for that category.
      setSheetTarget({ ...fromCategory, limit: null, budgetId: null, type })
    } else {
      setSheetTarget(null)
    }
    setSheetOpen(true)
  }

  function openEdit(budget: BudgetStatus) {
    setSheetTarget(budget)
    setSheetDefaultType(budget.type)
    setSheetOpen(true)
  }

  function openAddFunds(budget: BudgetStatus) {
    setFundsTarget(budget)
    setFundsOpen(true)
  }

  function openDelete(budget: BudgetStatus) {
    setDeleteTarget(budget)
  }

  async function confirmDelete() {
    if (!deleteTarget?.budgetId) return
    setIsDeleting(true)
    try {
      await deleteBudget(deleteTarget.budgetId)
      toast.success(
        deleteTarget.type === 'INCOME_GOAL' ? 'Income goal removed' : 'Budget removed',
      )
      setDeleteTarget(null)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to remove')
    } finally {
      setIsDeleting(false)
    }
  }

  // For BudgetSheet: pass the full target so a synth (limit:null, budgetId:null)
  // budget acts as a "create with category prefilled". The sheet flips to edit
  // mode only when budgetId is non-null.
  const sheetIsEditing = Boolean(sheetTarget?.budgetId)

  return (
    <div className="space-y-6">
      {/* ── Hero ────────────────────────────────────────────────── */}
      <Reveal as="section">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-[28px]">
              Budget management
            </h2>
            <p className="mt-1 text-sm font-medium text-muted-foreground">
              Set monthly spending limits and income goals per category.
            </p>
          </div>
          <Button
            onClick={() => openCreate('SPENDING')}
            className="gap-1.5 sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            New budget
          </Button>
        </div>
      </Reveal>

      {/* ── Overspent banner ────────────────────────────────────── */}
      <Reveal delay={40}>
        <OverspentBudgetAlert />
      </Reveal>

      {/* ── Main two-column grid ────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* LEFT — sections */}
        <div className="min-w-0 space-y-10 lg:col-span-2">
          {/* SPENDING */}
          <section className="space-y-4">
            <SectionHeader
              eyebrow="Spending"
              title="Spending budgets"
              description="What you plan to spend each month."
              action={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openCreate('SPENDING')}
                  className="gap-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add budget
                </Button>
              }
            />

            {isLoading ? (
              <BudgetGridSkeleton />
            ) : spendingBudgets.length === 0 ? (
              <EmptyState
                title="No categories to budget"
                description="Create some categories first so you can set monthly spending limits."
              />
            ) : (
              <div className="space-y-6">
                {activeSpending.length > 0 ? (
                  <BudgetGrid
                    budgets={activeSpending}
                    onEdit={openEdit}
                    onDelete={openDelete}
                    onAddFunds={openAddFunds}
                    onCreate={(b) => openCreate('SPENDING', b)}
                  />
                ) : (
                  <EmptyState
                    title="No active spending budgets"
                    description="Set a monthly limit for any category below to start tracking."
                    action={
                      <Button
                        size="sm"
                        onClick={() => openCreate('SPENDING')}
                        className="gap-1.5"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        New budget
                      </Button>
                    }
                  />
                )}

                {slotsSpending.length > 0 && (
                  <SubSection label={`No limit set · ${slotsSpending.length}`}>
                    <BudgetGrid
                      variant="slot"
                      budgets={slotsSpending}
                      onEdit={openEdit}
                      onDelete={openDelete}
                      onCreate={(b) => openCreate('SPENDING', b)}
                    />
                  </SubSection>
                )}
              </div>
            )}
          </section>

          {/* INCOME GOALS */}
          <section className="space-y-4">
            <SectionHeader
              eyebrow="Income"
              title="Income goals"
              description="What you aim to earn each month."
              action={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openCreate('INCOME_GOAL')}
                  className="gap-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add goal
                </Button>
              }
            />

            {isLoading ? (
              <BudgetGridSkeleton />
            ) : incomeGoals.length === 0 ? (
              <EmptyState
                title="No categories available"
                description="Create some categories so you can set monthly income goals for them."
              />
            ) : (
              <div className="space-y-6">
                {activeGoals.length > 0 ? (
                  <BudgetGrid
                    budgets={activeGoals}
                    onEdit={openEdit}
                    onDelete={openDelete}
                    onCreate={(b) => openCreate('INCOME_GOAL', b)}
                  />
                ) : (
                  <EmptyState
                    title="No active income goals"
                    description="Set a goal for any category below to track progress."
                    action={
                      <Button
                        size="sm"
                        onClick={() => openCreate('INCOME_GOAL')}
                        className="gap-1.5"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        New goal
                      </Button>
                    }
                  />
                )}

                {slotsGoals.length > 0 && (
                  <SubSection label={`No goal set · ${slotsGoals.length}`}>
                    <BudgetGrid
                      variant="slot"
                      budgets={slotsGoals}
                      onEdit={openEdit}
                      onDelete={openDelete}
                      onCreate={(b) => openCreate('INCOME_GOAL', b)}
                    />
                  </SubSection>
                )}
              </div>
            )}
          </section>
        </div>

        {/* RIGHT — sticky summary */}
        <aside className="min-w-0 lg:sticky lg:top-20 lg:col-span-1 lg:max-h-[calc(100vh-6rem)] lg:self-start">
          <Reveal delay={60} className="h-full min-w-0">
            <BudgetSummaryCard
              spendingBudgets={spendingBudgets}
              incomeGoals={incomeGoals}
              selectedMonth={selectedMonth}
              monthOptions={monthOptions}
              onMonthChange={setSelectedMonth}
            />
          </Reveal>
        </aside>
      </div>

      {/* ── Modals ──────────────────────────────────────────────── */}
      <BudgetSheet
        key={`${sheetIsEditing ? 'edit' : 'new'}-${sheetTarget?.budgetId ?? sheetTarget?.categoryId ?? 'none'}-${sheetDefaultType}`}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        month={selectedMonth}
        budget={sheetTarget}
        defaultType={sheetDefaultType}
      />

      <AddFundsDialog
        budget={fundsTarget}
        month={selectedMonth}
        open={fundsOpen}
        onOpenChange={setFundsOpen}
      />

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Remove{' '}
              {deleteTarget?.type === 'INCOME_GOAL' ? 'income goal' : 'budget'}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This removes the{' '}
              {deleteTarget?.type === 'INCOME_GOAL' ? 'goal' : 'limit'} for{' '}
              <span className="font-semibold text-foreground">
                {deleteTarget?.categoryName}
              </span>
              . Your transactions stay untouched.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={(e) => {
                e.preventDefault()
                confirmDelete()
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Removing…' : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function SectionHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {eyebrow}
        </p>
        <h3 className="mt-1 text-lg font-semibold tracking-tight">{title}</h3>
        <p className="mt-0.5 text-xs font-medium text-muted-foreground">
          {description}
        </p>
      </div>
      {action}
    </div>
  )
}

function SubSection({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <details className="group" open>
      <summary className="mb-3 flex cursor-pointer list-none items-center gap-1.5 px-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground">
        <Plus className="h-3 w-3 transition-transform group-open:rotate-45" />
        {label}
      </summary>
      {children}
    </details>
  )
}

function BudgetGridSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="space-y-4 rounded-2xl border border-border bg-card p-5"
        >
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-2/3" />
              <Skeleton className="h-2.5 w-1/3" />
            </div>
          </div>
          <Skeleton className="h-7 w-1/2" />
          <Skeleton className="h-1.5 w-full rounded-full" />
          <div className="flex justify-between">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-14" />
          </div>
        </div>
      ))}
    </div>
  )
}

