'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

interface OverBudgetWarningDialogProps {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
  categoryName: string
  categoryIcon: string
  limit: number
  effectiveSpent: number
  newAmount: number
  formatCurrency: (amount: number) => string
}

export function OverBudgetWarningDialog({
  open,
  onConfirm,
  onCancel,
  categoryName,
  categoryIcon,
  limit,
  effectiveSpent,
  newAmount,
  formatCurrency,
}: OverBudgetWarningDialogProps) {
  const projectedSpent = effectiveSpent + newAmount
  const overBy = projectedSpent - limit
  const remainingBefore = limit - effectiveSpent

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mb-3 flex items-start gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div>
              <DialogTitle className="text-lg leading-snug">
                Budget limit exceeded
              </DialogTitle>
              <DialogDescription className="mt-0.5">
                This transaction will push you over the{' '}
                <span className="font-medium text-foreground">{categoryIcon} {categoryName}</span>{' '}
                budget.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Budget breakdown */}
        <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
          <Row
            label="Monthly limit"
            value={formatCurrency(limit)}
          />
          <Row
            label="Already spent"
            value={formatCurrency(effectiveSpent)}
          />
          <Row
            label="This transaction"
            value={formatCurrency(newAmount)}
            accent
          />
          <div className="my-1.5 h-px bg-amber-200 dark:bg-amber-800/40" />
          <Row
            label="Remaining after"
            value={`−${formatCurrency(overBy)}`}
            danger
          />
        </div>

        {remainingBefore > 0 && (
          <p className="text-xs text-muted-foreground">
            You had{' '}
            <span className="font-medium text-foreground">{formatCurrency(remainingBefore)}</span>{' '}
            remaining before this transaction.
          </p>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Go back
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
          >
            Proceed anyway
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Row({
  label,
  value,
  accent,
  danger,
}: {
  label: string
  value: string
  accent?: boolean
  danger?: boolean
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={
          danger
            ? 'font-semibold tabular-nums text-destructive'
            : accent
              ? 'font-semibold tabular-nums text-amber-700 dark:text-amber-400'
              : 'font-medium tabular-nums text-foreground'
        }
      >
        {value}
      </span>
    </div>
  )
}
