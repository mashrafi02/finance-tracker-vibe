'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
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
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{isEditing ? 'Edit Category' : 'New Category'}</SheetTitle>
          <SheetDescription>
            {isEditing
              ? 'Update the category details below.'
              : 'Create a new category to organize your transactions.'}
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 rounded-2xl border border-border/70 bg-muted/15 p-4">
          <CategoryForm
            category={category}
            onSubmit={handleSubmit}
            onCancel={() => onOpenChange(false)}
            isSubmitting={isSubmitting}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}
