'use client'

import { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Plus } from 'lucide-react'
import { useSavingsEntries, type SavingsEntry } from '@/hooks/use-savings-entries'
import type { SavingsGoal } from '@/hooks/use-savings-goals'
import { useCurrency } from '@/contexts/currency-context'
import { EntriesTable } from './entries-table'
import { AddFundsDialog } from './add-funds-dialog'
import { EditEntryDialog } from './edit-entry-dialog'
import { DeleteEntryDialog } from './delete-entry-dialog'

interface EntriesSheetProps {
  goal: SavingsGoal | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EntriesSheet({ goal, open, onOpenChange }: EntriesSheetProps) {
  const { formatCurrency } = useCurrency()
  const [addOpen, setAddOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<SavingsEntry | null>(null)
  const [deletingEntry, setDeletingEntry] = useState<SavingsEntry | null>(null)

  const { entries, isLoading } = useSavingsEntries(goal?.id ?? null)

  const saved = goal ? Number(goal.savedAmount) : 0
  const target = goal ? Number(goal.targetAmount) : 0
  const pct =
    target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-xl"
        >
          <SheetHeader className="border-b border-border bg-muted/30 p-6">
            <SheetTitle className="text-xl font-semibold tracking-tight">
              {goal?.name ?? 'Savings goal'}
            </SheetTitle>
            <SheetDescription>
              Review, add, edit, or remove individual contributions to this goal.
            </SheetDescription>

            {goal && (
              <div className="mt-4 space-y-3">
                <div className="flex items-baseline justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Saved
                    </p>
                    <p className="font-mono text-2xl font-semibold tabular-nums">
                      {formatCurrency(saved)}
                      <span className="ml-1 text-sm font-medium text-muted-foreground">
                        / {formatCurrency(target)}
                      </span>
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-700 tabular-nums dark:text-emerald-300">
                    {pct}%
                  </span>
                </div>
                <Progress
                  value={pct}
                  className="[&_[data-slot=progress-indicator]]:bg-emerald-500"
                />
              </div>
            )}
          </SheetHeader>

          <div className="flex-1 space-y-4 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">Contribution history</h3>
                <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                  {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => setAddOpen(true)}
                disabled={!goal}
                className="gap-1"
              >
                <Plus className="h-3.5 w-3.5" />
                Add funds
              </Button>
            </div>

            <EntriesTable
              entries={entries}
              isLoading={isLoading}
              onEdit={setEditingEntry}
              onDelete={setDeletingEntry}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Nested dialogs operate on the currently-open goal */}
      <AddFundsDialog
        goal={goal}
        open={addOpen}
        onOpenChange={setAddOpen}
      />

      {goal && (
        <>
          <EditEntryDialog
            goalId={goal.id}
            entry={editingEntry}
            open={Boolean(editingEntry)}
            onOpenChange={(o) => !o && setEditingEntry(null)}
          />
          <DeleteEntryDialog
            goalId={goal.id}
            entry={deletingEntry}
            open={Boolean(deletingEntry)}
            onOpenChange={(o) => !o && setDeletingEntry(null)}
          />
        </>
      )}
    </>
  )
}
