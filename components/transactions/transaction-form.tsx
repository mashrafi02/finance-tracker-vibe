'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
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

  async function onSubmit(values: TransactionFormValues) {
    try {
      const url = isEditing
        ? `/api/transactions/${transaction!.id}`
        : '/api/transactions'
      const method = isEditing ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          amount: Number(values.amount),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error ?? 'Something went wrong')
        return
      }

      toast.success(isEditing ? 'Transaction updated' : 'Transaction added')
      onSuccess()
    } catch {
      toast.error('Failed to save. Please try again.')
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <Select onValueChange={field.onChange} value={field.value ?? 'EXPENSE'}>
                <FormControl>
                  <SelectTrigger>
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
                    <InputGroupText className="text-foreground">$</InputGroupText>
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

        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} value={field.value ?? ''}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
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
              <FormLabel>Note (optional)</FormLabel>
              <FormControl>
                <Input placeholder="Add a note..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-3 pt-3">
          <Button
            type="submit"
            className="flex-1"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {isEditing ? 'Save changes' : 'Add transaction'}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  )
}
