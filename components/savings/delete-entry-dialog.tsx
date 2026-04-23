'use client'

import { useState } from 'react'
import { toast } from 'sonner'
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
import { useSavingsEntries, type SavingsEntry } from '@/hooks/use-savings-entries'
import { useCurrency } from '@/contexts/currency-context'

interface DeleteEntryDialogProps {
  goalId: string
  entry: SavingsEntry | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteEntryDialog({
  goalId,
  entry,
  open,
  onOpenChange,
}: DeleteEntryDialogProps) {
  const { formatCurrency } = useCurrency()
  const [isDeleting, setIsDeleting] = useState(false)
  const { deleteEntry } = useSavingsEntries(goalId)

  async function handleDelete() {
    if (!entry) return

    setIsDeleting(true)
    try {
      await deleteEntry(entry.id)
      toast.success('Contribution removed')
      onOpenChange(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete entry')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg font-semibold tracking-tight">
            Delete this contribution?
          </AlertDialogTitle>
          <AlertDialogDescription>
            {entry
              ? <>This will remove {formatCurrency(Number(entry.amount))} from your savings goal.</>
              : 'This contribution will be removed.'}
            {' '}This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {isDeleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
