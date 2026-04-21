'use client'

import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>
            {isEditing ? 'Edit Transaction' : 'Add Transaction'}
          </SheetTitle>
          <SheetDescription>
            {isEditing
              ? 'Make changes to your transaction here.'
              : 'Add a new income or expense transaction.'}
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 rounded-2xl border border-border/70 bg-muted/15 p-4">
          <TransactionForm
            categories={categories}
            transaction={transaction}
            onSuccess={handleSuccess}
            onCancel={() => onOpenChange(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
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
