'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useSWRConfig } from 'swr'
import { useRouter } from 'next/navigation'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Loader2 } from 'lucide-react'

interface DeleteTransactionDialogProps {
  transactionId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function DeleteTransactionDialog({
  transactionId,
  open,
  onOpenChange,
  onSuccess,
}: DeleteTransactionDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const { mutate: globalMutate } = useSWRConfig()
  const router = useRouter()

  async function handleDelete() {
    if (!transactionId) return

    setIsDeleting(true)
    try {
      const res = await fetch(`/api/transactions/${transactionId}`, {
        method: 'DELETE',
      })

      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error ?? 'Failed to delete transaction')
        return
      }

      toast.success('Transaction deleted')
      globalMutate(
        (key) =>
          typeof key === 'string' &&
          (key.startsWith('/api/budgets') ||
            key.startsWith('/api/summary') ||
            key.startsWith('/api/analytics') ||
            key.startsWith('/api/transactions')),
      )
      router.refresh()
      onOpenChange(false)
      onSuccess()
    } catch {
      toast.error('Something went wrong')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg font-semibold tracking-tight">Delete transaction?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete this
            transaction from your records.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
