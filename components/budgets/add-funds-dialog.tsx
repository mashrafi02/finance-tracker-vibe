'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '@/components/ui/input-group'
import { Button } from '@/components/ui/button'
import { Loader2, PiggyBank } from 'lucide-react'
import { useBudgets, type BudgetStatus } from '@/hooks/use-budgets'
import { formatCurrency } from '@/lib/utils'

const addFundsFormSchema = z.object({
  amount: z
    .string()
    .min(1, 'Amount is required')
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) > 0,
      'Amount must be a positive number',
    ),
})

type AddFundsFormValues = z.infer<typeof addFundsFormSchema>

interface AddFundsDialogProps {
  budget: BudgetStatus | null
  month: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddFundsDialog({
  budget,
  month,
  open,
  onOpenChange,
}: AddFundsDialogProps) {
  const { addFundsToBudget } = useBudgets(month)

  const form = useForm<AddFundsFormValues>({
    resolver: zodResolver(addFundsFormSchema),
    defaultValues: { amount: '' },
  })

  // Reset form whenever the dialog opens for a different budget
  useEffect(() => {
    if (open) {
      form.reset({ amount: '' })
    }
  }, [open, budget?.budgetId, form])

  async function onSubmit(values: AddFundsFormValues) {
    if (!budget?.budgetId) {
      toast.error('No budget selected')
      return
    }

    try {
      await addFundsToBudget(budget.budgetId, Number(values.amount))
      toast.success(
        `Added ${formatCurrency(Number(values.amount))} to ${budget.categoryName}`,
      )
      onOpenChange(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to add funds')
    }
  }

  if (!budget || budget.limit === null) return null

  const newLimit = form.watch('amount')
    ? budget.limit + Number(form.watch('amount') || 0)
    : budget.limit

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mb-3 flex items-center gap-3">
            <span
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-base"
              style={{
                backgroundColor: `${budget.categoryColor}1F`,
                color: budget.categoryColor,
              }}
            >
              {budget.categoryIcon}
            </span>
            <div>
              <DialogTitle className="text-lg">Add to {budget.categoryName}</DialogTitle>
              <DialogDescription className="mt-0.5">
                Increase the monthly limit for this category.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Current state summary */}
        <div className="grid grid-cols-3 gap-2 rounded-xl border border-border/70 bg-muted/30 p-3">
          <Stat label="Current limit" value={formatCurrency(budget.limit)} />
          <Stat
            label="Spent"
            value={formatCurrency(budget.spent)}
            tone={budget.isOverspent ? 'danger' : 'default'}
          />
          <Stat
            label="Remaining"
            value={formatCurrency(budget.remaining ?? 0)}
            tone={
              budget.remaining !== null && budget.remaining < 0 ? 'danger' : 'success'
            }
          />
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount to add</FormLabel>
                  <FormControl>
                    <InputGroup className="h-10 rounded-xl">
                      <InputGroupAddon>
                        <InputGroupText className="text-foreground">$</InputGroupText>
                      </InputGroupAddon>
                      <InputGroupInput
                        type="number"
                        step="0.01"
                        min="0"
                        inputMode="decimal"
                        placeholder="0.00"
                        autoFocus
                        {...field}
                      />
                    </InputGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch('amount') && Number(form.watch('amount')) > 0 && (
              <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2.5 text-xs font-medium">
                <PiggyBank className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">New monthly limit:</span>
                <span className="ml-auto font-mono font-semibold tabular-nums text-primary">
                  {formatCurrency(newLimit)}
                </span>
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={form.formState.isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add funds'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

function Stat({
  label,
  value,
  tone = 'default',
}: {
  label: string
  value: string
  tone?: 'default' | 'danger' | 'success'
}) {
  const valueTone =
    tone === 'danger'
      ? 'text-rose-600 dark:text-rose-400'
      : tone === 'success'
      ? 'text-emerald-600 dark:text-emerald-400'
      : 'text-foreground'
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </p>
      <p className={`mt-0.5 font-mono text-xs font-semibold tabular-nums ${valueTone}`}>
        {value}
      </p>
    </div>
  )
}
