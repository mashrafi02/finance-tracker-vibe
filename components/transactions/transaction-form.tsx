'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useSWRConfig } from 'swr'
import { useRouter } from 'next/navigation'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from '@/components/ui/input-group'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowDownRight, ArrowUpRight, Loader2 } from 'lucide-react'
import type { Category } from '@/db/schema'
import type { TransactionWithCategory } from '@/hooks/use-transactions'
import { useCurrency } from '@/contexts/currency-context'
import { useBudgets } from '@/hooks/use-budgets'
import { useBalance } from '@/hooks/use-balance'
import { OverBudgetWarningDialog } from './over-budget-warning-dialog'

const transactionFormSchema = z.object({
  amount: z.string().min(1, 'Amount is required').refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    'Amount must be a positive number'
  ),
  type: z.enum(['INCOME', 'EXPENSE']),
  description: z.string().min(1, 'Description is required').max(200),
  date: z.string().min(1, 'Date is required'),
  categoryId: z.string().min(1, 'Please select a category'),
  note: z.string().max(500).optional(),
})

type TransactionFormValues = z.infer<typeof transactionFormSchema>

interface TransactionFormProps {
  categories: Category[]
  transaction?: TransactionWithCategory
  onSuccess: () => void
  onCancel: () => void
}

export function TransactionForm({
  categories,
  transaction,
  onSuccess,
  onCancel,
}: TransactionFormProps) {
  const isEditing = Boolean(transaction)
  const { mutate: globalMutate } = useSWRConfig()
  const router = useRouter()
  const { currencySymbol, formatCurrency } = useCurrency()
  const { balance } = useBalance()

  const [pendingValues, setPendingValues] = useState<TransactionFormValues | null>(null)

  // Parse note from description if editing (note is stored as "description | note")
  const parseDescriptionAndNote = (desc: string) => {
    const parts = desc.split(' | ')
    return {
      description: parts[0] || '',
      note: parts[1] || '',
    }
  }

  const parsed = transaction
    ? parseDescriptionAndNote(transaction.description)
    : { description: '', note: '' }

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      amount: transaction ? transaction.amount : '',
      type: transaction?.type ?? 'EXPENSE',
      description: parsed.description,
      date: transaction
        ? new Date(transaction.date).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      categoryId: transaction?.category.id ?? '',
      note: parsed.note,
    },
  })

  // Watch the date field so we can load budgets for the correct month.
  const watchedDate = form.watch('date')
  const budgetMonth = watchedDate
    ? watchedDate.slice(0, 7)      // "YYYY-MM"
    : new Date().toISOString().slice(0, 7)
  const { spendingBudgets } = useBudgets(budgetMonth)

  // ── API call (shared by direct submit and confirmed over-budget submit) ──
  async function saveTransaction(values: TransactionFormValues) {
    const url = isEditing
      ? `/api/transactions/${transaction!.id}`
      : '/api/transactions'
    const method = isEditing ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...values, amount: Number(values.amount) }),
    })

    if (!res.ok) {
      const data = await res.json()
      if (res.status === 402) {
        // Always enhance insufficient balance errors with current balance
        const message = `Insufficient balance for this transaction. You only have ${formatCurrency(balance)} available.`
        form.setError('amount', { type: 'server', message })
        toast.error(message)
        return false
      }
      toast.error(data.error ?? 'Something went wrong')
      return false
    }

    toast.success(isEditing ? 'Transaction updated' : 'Transaction added')
    globalMutate(
      (key) =>
        typeof key === 'string' &&
        (key.startsWith('/api/budgets') ||
          key.startsWith('/api/summary') ||
          key.startsWith('/api/analytics') ||
          key.startsWith('/api/transactions')),
    )
    router.refresh()
    onSuccess()
    return true
  }

  async function onSubmit(values: TransactionFormValues) {
    // Only expense transactions are subject to budget checks.
    if (values.type === 'EXPENSE') {
      const budget = spendingBudgets.find((b) => b.categoryId === values.categoryId)

      if (budget && budget.limit !== null) {
        // When editing, exclude the original amount so we don't double-count it.
        const originalAmount = isEditing ? Number(transaction!.amount) : 0
        const effectiveSpent = budget.spent - originalAmount
        const projectedSpent = effectiveSpent + Number(values.amount)

        if (projectedSpent > budget.limit) {
          // Store values and open the warning dialog — do NOT call the API yet.
          setPendingValues(values)
          return
        }
      }
    }

    try {
      await saveTransaction(values)
    } catch {
      toast.error('Failed to save. Please try again.')
    }
  }

  // Called when user clicks "Proceed anyway" in the warning dialog.
  async function handleConfirmOverBudget() {
    if (!pendingValues) return
    setPendingValues(null)
    try {
      await saveTransaction(pendingValues)
    } catch {
      toast.error('Failed to save. Please try again.')
    }
  }

  // Compute dialog props from pendingValues (safe to derive because the dialog
  // is only shown while pendingValues is non-null).
  const warningDialogProps = (() => {
    if (!pendingValues) return null
    const budget = spendingBudgets.find((b) => b.categoryId === pendingValues.categoryId)
    if (!budget || budget.limit === null) return null
    const originalAmount = isEditing ? Number(transaction!.amount) : 0
    const effectiveSpent = budget.spent - originalAmount
    return {
      categoryName: budget.categoryName,
      categoryIcon: budget.categoryIcon,
      limit: budget.limit,
      effectiveSpent,
      newAmount: Number(pendingValues.amount),
    }
  })()

  return (
    <>
      {warningDialogProps && (
        <OverBudgetWarningDialog
          open={Boolean(pendingValues)}
          onConfirm={handleConfirmOverBudget}
          onCancel={() => setPendingValues(null)}
          formatCurrency={(n) => formatCurrency(n)}
          {...warningDialogProps}
        />
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select onValueChange={field.onChange} value={field.value ?? 'EXPENSE'}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="INCOME">
                      <span className="flex items-center gap-2">
                        <ArrowUpRight className="h-4 w-4 text-emerald-600" /> Income
                      </span>
                    </SelectItem>
                    <SelectItem value="EXPENSE">
                      <span className="flex items-center gap-2">
                        <ArrowDownRight className="h-4 w-4 text-red-600" /> Expense
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <InputGroup className="h-10 rounded-xl">
                    <InputGroupAddon>
                      <InputGroupText className="text-foreground">{currencySymbol}</InputGroupText>
                    </InputGroupAddon>
                    <InputGroupInput
                      type="number"
                      step="0.01"
                      min="0"
                      inputMode="decimal"
                      placeholder="0.00"
                      aria-invalid={Boolean(form.formState.errors.amount) || undefined}
                      {...field}
                    />
                  </InputGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => {
              const selectedCat = categories.find((c) => c.id === field.value)
              return (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? ''}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        {selectedCat ? (
                          <span className="flex items-center gap-2">
                            <span>{selectedCat.icon}</span>
                            <span>{selectedCat.name}</span>
                          </span>
                        ) : (
                          <SelectValue placeholder="Select a category" />
                        )}
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          <span className="flex items-center gap-2">
                            <span>{cat.icon}</span>
                            <span>{cat.name}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )
            }}
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
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Weekly groceries" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="note"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Note <span className="font-normal text-muted-foreground">(optional)</span>
              </FormLabel>
              <FormControl>
                <Textarea rows={3} placeholder="Add a note..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="-mx-6 -mb-6 flex flex-col-reverse gap-2 border-t bg-muted/30 px-6 py-4 sm:flex-row sm:justify-end sm:gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="sm:min-w-[160px]"
          >
            {form.formState.isSubmitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {isEditing ? 'Save changes' : 'Add transaction'}
          </Button>
        </div>
      </form>
      </Form>
    </>
  )
}