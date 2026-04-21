'use client'

import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { TransactionForm } from './transaction-form'
import type { Category } from '@/db/schema'
import type { TransactionWithCategory } from '@/hooks/use-transactions'

interface TransactionSheetProps {
  categories: Category[]
  transaction?: TransactionWithCategory
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function TransactionSheet({
  categories,
  transaction,
  open,
  onOpenChange,
  onSuccess,
}: TransactionSheetProps) {
  const isEditing = Boolean(transaction)

  const handleSuccess = () => {
    onOpenChange(false)
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto p-6 sm:max-w-2xl">
        <DialogHeader className="mb-2">
          <DialogTitle className="text-lg">
            {isEditing ? 'Edit transaction' : 'Add transaction'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the details of this transaction.'
              : 'Record a new income or expense transaction.'}
          </DialogDescription>
        </DialogHeader>
        <TransactionForm
          categories={categories}
          transaction={transaction}
          onSuccess={handleSuccess}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

interface NewTransactionButtonProps {
  categories: Category[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function NewTransactionButton({
  categories,
  open,
  onOpenChange,
  onSuccess,
}: NewTransactionButtonProps) {
  return (
    <>
      <Button onClick={() => onOpenChange(true)} className="shadow-sm">
        <Plus className="mr-2 h-4 w-4" />
        Add Transaction
      </Button>
      <TransactionSheet
        categories={categories}
        open={open}
        onOpenChange={onOpenChange}
        onSuccess={onSuccess}
      />
    </>
  )
}
