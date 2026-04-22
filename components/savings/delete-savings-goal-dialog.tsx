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
import { useSavingsGoals, type SavingsGoal } from '@/hooks/use-savings-goals'

interface DeleteSavingsGoalDialogProps {
  goal: SavingsGoal | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function DeleteSavingsGoalDialog({
  goal,
  open,
  onOpenChange,
  onSuccess,
}: DeleteSavingsGoalDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const { deleteGoal } = useSavingsGoals()

  async function handleDelete() {
    if (!goal) return

    setIsDeleting(true)
    try {
      await deleteGoal(goal.id)
      toast.success(`Deleted "${goal.name}"`)
      onOpenChange(false)
      onSuccess?.()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete goal')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg font-semibold tracking-tight">
            Delete {goal ? `"${goal.name}"` : 'savings goal'}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. All contribution history for this
            goal will be permanently removed.
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
            Delete goal
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
