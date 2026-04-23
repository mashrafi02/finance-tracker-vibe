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
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Loader2, Wallet } from 'lucide-react'
import { useSavingsEntries } from '@/hooks/use-savings-entries'
import type { SavingsGoal } from '@/hooks/use-savings-goals'
import { useCurrency } from '@/contexts/currency-context'

const addFundsSchema = z.object({
  amount: z
    .string()
    .min(1, 'Amount is required')
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) > 0,
      'Amount must be greater than 0',
    ),
  date: z.string().min(1, 'Date is required'),
})

type AddFundsValues = z.infer<typeof addFundsSchema>

interface AddFundsDialogProps {
  goal: SavingsGoal | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddFundsDialog({
  goal,
  open,
  onOpenChange,
}: AddFundsDialogProps) {
  const { formatCurrency } = useCurrency()
  const { createEntry } = useSavingsEntries(goal?.id ?? null)

  const form = useForm<AddFundsValues>({
    resolver: zodResolver(addFundsSchema),
    defaultValues: {
      amount: '',
      date: new Date().toISOString().split('T')[0],
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        amount: '',
        date: new Date().toISOString().split('T')[0],
      })
    }
  }, [open, form])

  async function onSubmit(values: AddFundsValues) {
    if (!goal) return
    try {
      await createEntry({
        amount: Number(values.amount),
        // Backend expects ISO datetime
        date: new Date(values.date).toISOString(),
      })
      toast.success(`Added ${formatCurrency(Number(values.amount))} to "${goal.name}"`)
      onOpenChange(false)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to add funds'
      // Surface the error both inline on the amount field and as a toast so it
      // is immediately visible even if the user has scrolled past the field.
      form.setError('amount', { type: 'server', message })
      toast.error(message)
    }
  }

  const amountNum = Number(form.watch('amount') || 0)

  // Preview computed values
  const saved = goal ? Number(goal.savedAmount) : 0
  const target = goal ? Number(goal.targetAmount) : 0
  const projectedSaved = saved + amountNum
  const projectedPct =
    target > 0 ? Math.min(100, Math.round((projectedSaved / target) * 100)) : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mb-3 flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <Wallet className="h-4 w-4" />
            </span>
            <div>
              <DialogTitle className="text-lg">Add funds</DialogTitle>
              <DialogDescription className="mt-0.5">
                {goal
                  ? <>Contribute to <span className="font-semibold">{goal.name}</span></>
                  : 'Contribute to your goal'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <InputGroup>
                      <InputGroupAddon align="inline-start">
                        <InputGroupText>$</InputGroupText>
                      </InputGroupAddon>
                      <InputGroupInput
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        min="0"
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

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {goal && amountNum > 0 && (
              <div className="space-y-2 rounded-lg border border-border bg-muted/40 px-3 py-2.5">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    After this contribution
                  </p>
                  <span className="rounded-full bg-background px-2 py-0.5 text-[10px] font-semibold tabular-nums text-emerald-700 dark:text-emerald-300">
                    {projectedPct}%
                  </span>
                </div>
                <p className="font-mono text-base font-semibold tabular-nums">
                  {formatCurrency(projectedSaved)}{' '}
                  <span className="text-sm font-medium text-muted-foreground">
                    / {formatCurrency(target)}
                  </span>
                </p>
                <Progress
                  value={projectedPct}
                  className="[&_[data-slot=progress-indicator]]:bg-emerald-500"
                />
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={form.formState.isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                )}
                Add funds
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
