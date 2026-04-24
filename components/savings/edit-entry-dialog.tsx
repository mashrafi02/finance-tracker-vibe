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
import { Loader2, Pencil } from 'lucide-react'
import { useSavingsEntries, type SavingsEntry } from '@/hooks/use-savings-entries'
import { useCurrency } from '@/contexts/currency-context'

const editEntrySchema = z.object({
  amount: z
    .string()
    .min(1, 'Amount is required')
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) > 0,
      'Amount must be greater than 0',
    ),
  date: z.string().min(1, 'Date is required'),
})

type EditEntryValues = z.infer<typeof editEntrySchema>

interface EditEntryDialogProps {
  goalId: string
  entry: SavingsEntry | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditEntryDialog({
  goalId,
  entry,
  open,
  onOpenChange,
}: EditEntryDialogProps) {
  const { updateEntry } = useSavingsEntries(goalId)
  const { currencySymbol } = useCurrency()

  const form = useForm<EditEntryValues>({
    resolver: zodResolver(editEntrySchema),
    defaultValues: {
      amount: entry?.amount ?? '',
      date: entry
        ? new Date(entry.date).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
    },
  })

  useEffect(() => {
    if (open && entry) {
      form.reset({
        amount: entry.amount,
        date: new Date(entry.date).toISOString().split('T')[0],
      })
    }
  }, [open, entry, form])

  async function onSubmit(values: EditEntryValues) {
    if (!entry) return
    try {
      await updateEntry(entry.id, {
        amount: Number(values.amount),
        date: new Date(values.date).toISOString(),
      })
      toast.success('Entry updated')
      onOpenChange(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update entry')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mb-3 flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400">
              <Pencil className="h-4 w-4" />
            </span>
            <div>
              <DialogTitle className="text-lg">Edit contribution</DialogTitle>
              <DialogDescription className="mt-0.5">
                Update the amount or date of this savings entry.
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
                        <InputGroupText>{currencySymbol}</InputGroupText>
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
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
