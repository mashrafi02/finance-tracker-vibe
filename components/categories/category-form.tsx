'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import type { Category } from '@/db/schema'

const categoryFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name must be 50 characters or less'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color (e.g., #22c55e)'),
  icon: z.string().min(1, 'Icon is required').max(10, 'Icon must be 10 characters or less'),
})

type CategoryFormValues = z.infer<typeof categoryFormSchema>

interface CategoryFormProps {
  category?: Category
  onSubmit: (values: CategoryFormValues) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

export function CategoryForm({
  category,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: CategoryFormProps) {
  const isEditing = Boolean(category)

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: category?.name ?? '',
      color: category?.color ?? '#6b7280',
      icon: category?.icon ?? '',
    },
  })

  async function handleSubmit(values: CategoryFormValues) {
    await onSubmit(values)
  }

  // Preview the color and icon
  const watchedColor = form.watch('color')
  const watchedIcon = form.watch('icon')
  const isValidColor = /^#[0-9A-Fa-f]{6}$/.test(watchedColor)

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
        {/* Preview */}
        <div className="flex items-center gap-3 rounded-xl border border-border/80 bg-muted/20 p-4">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg text-xl"
            style={{
              backgroundColor: isValidColor ? `${watchedColor}20` : '#6b728020',
              color: isValidColor ? watchedColor : '#6b7280',
            }}
          >
            {watchedIcon || '?'}
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight">{form.watch('name') || 'Category Name'}</p>
            <p className="text-xs font-medium text-muted-foreground">Preview</p>
          </div>
        </div>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Groceries" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="icon"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Icon</FormLabel>
              <FormControl>
                <Input placeholder="e.g., 🛒" {...field} />
              </FormControl>
              <FormDescription>
                Enter an emoji to represent this category
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Color</FormLabel>
              <div className="flex gap-2">
                <FormControl>
                  <Input placeholder="#22c55e" {...field} className="flex-1" />
                </FormControl>
                <div
                  className="h-9 w-9 shrink-0 rounded-md border"
                  style={{
                    backgroundColor: isValidColor ? watchedColor : '#ffffff',
                  }}
                />
              </div>
              <FormDescription>
                Enter a hex color code (e.g., #22c55e for green)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-3 pt-3">
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Save changes' : 'Create category'}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  )
}
