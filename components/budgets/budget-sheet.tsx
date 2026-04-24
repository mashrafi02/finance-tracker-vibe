'use client'

import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, PiggyBank, Target } from 'lucide-react'

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '@/components/ui/input-group'
import { Button } from '@/components/ui/button'
import { useBudgets, type BudgetStatus, type BudgetType } from '@/hooks/use-budgets'
import { cn } from '@/lib/utils'
import { useCurrency } from '@/contexts/currency-context'

const budgetFormSchema = z.object({
  categoryId: z.string().min(1, 'Pick a category'),
  type: z.enum(['SPENDING', 'INCOME_GOAL']),
  limit: z
    .string()
    .min(1, 'Enter an amount')
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) > 0,
      'Amount must be greater than 0',
    ),
})

type BudgetFormValues = z.infer<typeof budgetFormSchema>

interface BudgetSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Currently-selected month in YYYY-MM. */
  month: string
  /** When provided, the form opens in edit mode (locks category + type). */
  budget?: BudgetStatus | null
  /** Default type used when creating a new budget. */
  defaultType?: BudgetType
}

function formatMonthLong(month: string) {
  const [y, m] = month.split('-')
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(
    new Date(parseInt(y), parseInt(m) - 1),
  )
}

export function BudgetSheet({
  open,
  onOpenChange,
  month,
  budget,
  defaultType = 'SPENDING',
}: BudgetSheetProps) {
  const { formatCurrency, currencySymbol } = useCurrency()
  // Treat as "edit" only when an existing budgetId is present.
  // A passed-in budget without budgetId is treated as a prefilled "create".
  const isEditing = Boolean(budget?.budgetId)
  const { spendingBudgets, incomeGoals, createOrUpdateBudget } = useBudgets(month)

  const form = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: {
      categoryId: budget?.categoryId ?? '',
      type: budget?.type ?? defaultType,
      limit: budget?.limit?.toString() ?? '',
    },
  })

  // Re-sync form when the dialog re-opens with a different target.
  useEffect(() => {
    if (open) {
      form.reset({
        categoryId: budget?.categoryId ?? '',
        type: budget?.type ?? defaultType,
        limit: budget?.limit?.toString() ?? '',
      })
    }
  }, [open, budget, defaultType, form])

  const watchedType = form.watch('type')
  const watchedLimit = form.watch('limit')

  // Categories that don't already have a budget of the chosen type for this month.
  const availableOptions = useMemo(() => {
    const pool = watchedType === 'INCOME_GOAL' ? incomeGoals : spendingBudgets
    return pool
      .filter((b) => isEditing || b.limit === null)
      .map((b) => ({
        value: b.categoryId,
        label: b.categoryName,
        icon: b.categoryIcon,
        color: b.categoryColor,
      }))
  }, [spendingBudgets, incomeGoals, watchedType, isEditing])

  // If user switches type while creating, clear the chosen category if it's no longer valid.
  useEffect(() => {
    if (isEditing) return
    const current = form.getValues('categoryId')
    if (current && !availableOptions.some((o) => o.value === current)) {
      form.setValue('categoryId', '')
    }
  }, [availableOptions, isEditing, form])

  async function onSubmit(values: BudgetFormValues) {
    try {
      await createOrUpdateBudget(
        values.categoryId,
        Number(values.limit),
        month,
        values.type,
      )
      toast.success(isEditing ? 'Budget updated' : 'Budget created')
      onOpenChange(false)
    } catch (e) {
      toast.error(
        e instanceof Error
          ? e.message
          : isEditing
            ? 'Failed to update budget'
            : 'Failed to create budget',
      )
    }
  }

  const previewAmount = Number(watchedLimit || 0)
  const isIncome = watchedType === 'INCOME_GOAL'
  const accentIcon = isIncome ? Target : PiggyBank
  const Icon = accentIcon
  const accentClass = isIncome
    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
    : 'bg-primary/10 text-primary'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mb-3 flex items-center gap-3">
            <span
              className={cn(
                'inline-flex h-10 w-10 items-center justify-center rounded-xl',
                accentClass,
              )}
            >
              <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <DialogTitle className="text-lg">
                {isEditing
                  ? isIncome
                    ? 'Edit income goal'
                    : 'Edit budget'
                  : isIncome
                    ? 'New income goal'
                    : 'New budget'}
              </DialogTitle>
              <DialogDescription className="mt-0.5">
                For {formatMonthLong(month)}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Type — segmented buttons (locked when editing) */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <FormControl>
                    <div
                      role="radiogroup"
                      className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-muted/40 p-1"
                    >
                      <button
                        type="button"
                        role="radio"
                        aria-checked={field.value === 'SPENDING'}
                        disabled={isEditing}
                        onClick={() => field.onChange('SPENDING')}
                        className={cn(
                          'flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors',
                          field.value === 'SPENDING'
                            ? 'bg-card text-foreground shadow-card dark:bg-accent'
                            : 'text-muted-foreground hover:text-foreground',
                          isEditing && 'cursor-not-allowed opacity-60',
                        )}
                      >
                        <PiggyBank className="h-3.5 w-3.5" />
                        Spending limit
                      </button>
                      <button
                        type="button"
                        role="radio"
                        aria-checked={field.value === 'INCOME_GOAL'}
                        disabled={isEditing}
                        onClick={() => field.onChange('INCOME_GOAL')}
                        className={cn(
                          'flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors',
                          field.value === 'INCOME_GOAL'
                            ? 'bg-card text-foreground shadow-card dark:bg-accent'
                            : 'text-muted-foreground hover:text-foreground',
                          isEditing && 'cursor-not-allowed opacity-60',
                        )}
                      >
                        <Target className="h-3.5 w-3.5" />
                        Income goal
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Category */}
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => {
                const selectedOpt = availableOptions.find((o) => o.value === field.value)
                return (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={isEditing}
                      >
                        <SelectTrigger className="h-10 w-full">
                          {selectedOpt ? (
                            <span className="flex items-center gap-2">
                              <span
                                className="inline-flex h-5 w-5 items-center justify-center rounded-md text-[11px]"
                                style={{
                                  backgroundColor: `${selectedOpt.color}1F`,
                                  color: selectedOpt.color,
                                }}
                              >
                                {selectedOpt.icon}
                              </span>
                              {selectedOpt.label}
                            </span>
                          ) : (
                            <SelectValue placeholder="Choose a category" />
                          )}
                        </SelectTrigger>
                        <SelectContent>
                          {availableOptions.length === 0 ? (
                            <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                              All categories already have a {isIncome ? 'goal' : 'budget'}.
                            </div>
                          ) : (
                            availableOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                <span className="flex items-center gap-2">
                                  <span
                                    className="inline-flex h-5 w-5 items-center justify-center rounded-md text-[11px]"
                                    style={{
                                      backgroundColor: `${opt.color}1F`,
                                      color: opt.color,
                                    }}
                                  >
                                    {opt.icon}
                                  </span>
                                  {opt.label}
                                </span>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )
              }}
            />

            {/* Limit */}
            <FormField
              control={form.control}
              name="limit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isIncome ? 'Goal amount' : 'Monthly limit'}</FormLabel>
                  <FormControl>
                    <InputGroup className="h-10 rounded-xl">
                      <InputGroupAddon align="inline-start">
                        <InputGroupText>{currencySymbol}</InputGroupText>
                      </InputGroupAddon>
                      <InputGroupInput
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        autoFocus={!isEditing}
                        {...field}
                      />
                    </InputGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {previewAmount > 0 && (
              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {isIncome ? 'Goal' : 'Limit'}
                </p>
                <p className="font-mono text-sm font-semibold tabular-nums">
                  {formatCurrency(previewAmount)}
                </p>
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
              <Button
                type="submit"
                disabled={
                  form.formState.isSubmitting ||
                  (!isEditing && availableOptions.length === 0)
                }
              >
                {form.formState.isSubmitting && (
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                )}
                {isEditing ? 'Save changes' : isIncome ? 'Create goal' : 'Create budget'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
