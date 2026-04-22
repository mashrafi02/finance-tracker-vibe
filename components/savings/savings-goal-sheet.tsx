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
import { Loader2, Target } from 'lucide-react'
import { useSavingsGoals, type SavingsGoal } from '@/hooks/use-savings-goals'
import { formatCurrency } from '@/lib/utils'

const goalFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  targetAmount: z
    .string()
    .min(1, 'Target amount is required')
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) > 0,
      'Target amount must be greater than 0',
    ),
})

type GoalFormValues = z.infer<typeof goalFormSchema>

interface SavingsGoalSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  goal?: SavingsGoal
}

export function SavingsGoalSheet({
  open,
  onOpenChange,
  goal,
}: SavingsGoalSheetProps) {
  const isEditing = Boolean(goal)
  const { createGoal, updateGoal } = useSavingsGoals()

  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: {
      name: goal?.name ?? '',
      targetAmount: goal ? goal.targetAmount : '',
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        name: goal?.name ?? '',
        targetAmount: goal ? goal.targetAmount : '',
      })
    }
  }, [open, goal, form])

  async function onSubmit(values: GoalFormValues) {
    try {
      if (isEditing && goal) {
        await updateGoal(goal.id, {
          name: values.name.trim(),
          targetAmount: Number(values.targetAmount),
        })
        toast.success('Goal updated')
      } else {
        await createGoal({
          name: values.name.trim(),
          targetAmount: Number(values.targetAmount),
        })
        toast.success(`Created "${values.name}" goal`)
      }
      onOpenChange(false)
    } catch (e) {
      toast.error(
        e instanceof Error
          ? e.message
          : isEditing
            ? 'Failed to update goal'
            : 'Failed to create goal',
      )
    }
  }

  const preview = Number(form.watch('targetAmount') || 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mb-3 flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <Target className="h-4 w-4" />
            </span>
            <div>
              <DialogTitle className="text-lg">
                {isEditing ? 'Edit savings goal' : 'New savings goal'}
              </DialogTitle>
              <DialogDescription className="mt-0.5">
                {isEditing
                  ? 'Update the name or target for this goal.'
                  : 'Set a name and target amount to start tracking.'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Goal name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Dream vacation, Emergency fund"
                      autoFocus
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="targetAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target amount</FormLabel>
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
                        {...field}
                      />
                    </InputGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {preview > 0 && (
              <div className="rounded-lg border border-border bg-muted/40 px-3 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Target
                </p>
                <p className="mt-0.5 font-mono text-base font-semibold tabular-nums">
                  {formatCurrency(preview)}
                </p>
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
                {isEditing ? 'Save changes' : 'Create goal'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
