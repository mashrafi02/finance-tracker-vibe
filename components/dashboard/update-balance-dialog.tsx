'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, Wallet } from 'lucide-react'
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
import { useBalance } from '@/hooks/use-balance'
import { useCurrency } from '@/contexts/currency-context'

const updateBalanceFormSchema = z.object({
  balance: z
    .string()
    .min(1, 'Balance is required')
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) >= 0,
      'Balance must be zero or greater',
    ),
})

type UpdateBalanceFormValues = z.infer<typeof updateBalanceFormSchema>

interface UpdateBalanceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The balance currently shown on the card (from the SSR page). */
  currentBalance: number
}

export function UpdateBalanceDialog({
  open,
  onOpenChange,
  currentBalance,
}: UpdateBalanceDialogProps) {
  const { formatCurrency } = useCurrency()
  const { updateBalance } = useBalance()

  const form = useForm<UpdateBalanceFormValues>({
    resolver: zodResolver(updateBalanceFormSchema),
    defaultValues: {
      balance: currentBalance > 0 ? currentBalance.toFixed(2) : '',
    },
  })

  // Re-sync when the dialog re-opens so stale values from the last session
  // don't linger (e.g. after the server refreshes the balance).
  useEffect(() => {
    if (open) {
      form.reset({
        balance: currentBalance > 0 ? currentBalance.toFixed(2) : '',
      })
    }
  }, [open, currentBalance, form])

  async function onSubmit(values: UpdateBalanceFormValues) {
    try {
      await updateBalance(Number(values.balance))
      toast.success(
        `Balance updated to ${formatCurrency(Number(values.balance))}`,
      )
      onOpenChange(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update balance')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary" aria-hidden="true" />
            Update Balance
          </DialogTitle>
          <DialogDescription>
            Enter your current available funds. Income transactions add to
            this automatically — use this to set your starting balance or
            correct it after adding cash.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="balance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Available Balance</FormLabel>
                  <FormControl>
                    <InputGroup>
                      <InputGroupAddon>
                        <InputGroupText>$</InputGroupText>
                      </InputGroupAddon>
                      <InputGroupInput
                        {...field}
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        autoFocus
                      />
                    </InputGroup>
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
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  'Save Balance'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
