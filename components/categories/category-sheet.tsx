'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CategoryForm } from './category-form'
import type { Category } from '@/db/schema'

interface CategorySheetProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  category?: Category
  onSuccess: () => void
}

export function CategorySheet({
  isOpen,
  onOpenChange,
  category,
  onSuccess,
}: CategorySheetProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEditing = Boolean(category)

  async function handleSubmit(values: { name: string; color: string; icon: string }) {
    setIsSubmitting(true)

    try {
      const url = isEditing
        ? `/api/categories/${category!.id}`
        : '/api/categories'
      const method = isEditing ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error ?? 'Something went wrong')
        return
      }

      toast.success(isEditing ? 'Category updated' : 'Category created')
      onSuccess()
      onOpenChange(false)
    } catch {
      toast.error('Failed to save. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto p-6 sm:max-w-xl">
        <DialogHeader className="mb-2">
          <DialogTitle className="text-lg">
            {isEditing ? 'Edit category' : 'New category'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the category details below.'
              : 'Create a new category to organize your transactions.'}
          </DialogDescription>
        </DialogHeader>
        <CategoryForm
          category={category}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  )
}
