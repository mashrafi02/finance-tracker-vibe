'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Check, Loader2, Smile } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Category } from '@/db/schema'

// Lazy-load emoji picker to keep initial bundle small
const EmojiPicker = dynamic(() => import('emoji-picker-react'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[350px] w-[300px] items-center justify-center text-sm text-muted-foreground">
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Loading picker…
    </div>
  ),
})

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

// Curated palette — calm, saturated tones that read well on muted backgrounds
const COLOR_PALETTE = [
  { value: '#ef4444', name: 'Red' },
  { value: '#f97316', name: 'Orange' },
  { value: '#f59e0b', name: 'Amber' },
  { value: '#eab308', name: 'Yellow' },
  { value: '#84cc16', name: 'Lime' },
  { value: '#22c55e', name: 'Green' },
  { value: '#10b981', name: 'Emerald' },
  { value: '#14b8a6', name: 'Teal' },
  { value: '#06b6d4', name: 'Cyan' },
  { value: '#0ea5e9', name: 'Sky' },
  { value: '#3b82f6', name: 'Blue' },
  { value: '#6366f1', name: 'Indigo' },
  { value: '#8b5cf6', name: 'Violet' },
  { value: '#a855f7', name: 'Purple' },
  { value: '#d946ef', name: 'Fuchsia' },
  { value: '#ec4899', name: 'Pink' },
  { value: '#f43f5e', name: 'Rose' },
  { value: '#6b7280', name: 'Gray' },
]

export function CategoryForm({
  category,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: CategoryFormProps) {
  const isEditing = Boolean(category)
  const [emojiOpen, setEmojiOpen] = useState(false)

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: category?.name ?? '',
      color: category?.color ?? '#3b82f6',
      icon: category?.icon ?? '',
    },
  })

  async function handleSubmit(values: CategoryFormValues) {
    await onSubmit(values)
  }

  const watchedColor = form.watch('color')
  const watchedIcon = form.watch('icon')
  const watchedName = form.watch('name')
  const isValidColor = /^#[0-9A-Fa-f]{6}$/.test(watchedColor)

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
        {/* Preview */}
        <div className="flex items-center gap-3 rounded-xl border border-border/80 bg-muted/20 p-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl"
            style={{
              backgroundColor: isValidColor ? `${watchedColor}20` : '#6b728020',
              color: isValidColor ? watchedColor : '#6b7280',
            }}
          >
            {watchedIcon || '?'}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-tight">
              {watchedName || 'Category name'}
            </p>
            <p className="text-xs font-medium text-muted-foreground">Preview</p>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-[1fr_auto]">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Groceries" autoComplete="off" {...field} />
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
                <div className="flex items-center gap-2">
                  <FormControl>
                    <Input
                      placeholder="🛒"
                      autoComplete="off"
                      className="w-20 text-center text-lg"
                      {...field}
                    />
                  </FormControl>
                  <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
                    <PopoverTrigger
                      className={cn(
                        'inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-background text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                      )}
                      aria-label="Open emoji picker"
                    >
                      <Smile className="h-4 w-4" />
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto border-none p-0 shadow-lg"
                      align="end"
                      sideOffset={6}
                    >
                      <EmojiPicker
                        onEmojiClick={(emojiData) => {
                          form.setValue('icon', emojiData.emoji, {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                          setEmojiOpen(false)
                        }}
                        width={320}
                        height={380}
                        lazyLoadEmojis
                        previewConfig={{ showPreview: false }}
                        searchPlaceHolder="Search emoji"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Color</FormLabel>
              <div className="flex flex-wrap gap-1.5">
                {COLOR_PALETTE.map((c) => {
                  const isActive = watchedColor.toLowerCase() === c.value.toLowerCase()
                  return (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() =>
                        form.setValue('color', c.value, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                      className={cn(
                        'relative flex h-7 w-7 items-center justify-center rounded-md ring-1 ring-border/60 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                        isActive && 'ring-2 ring-offset-2 ring-foreground'
                      )}
                      style={{ backgroundColor: c.value }}
                      aria-label={`Select ${c.name}`}
                      aria-pressed={isActive}
                      title={c.name}
                    >
                      {isActive && <Check className="h-3 w-3 text-white drop-shadow" />}
                    </button>
                  )
                })}
              </div>
              <div className="flex items-center gap-2 pt-2">
                <FormControl>
                  <Input
                    placeholder="#22c55e"
                    autoComplete="off"
                    className="h-9 font-mono text-sm"
                    {...field}
                  />
                </FormControl>
                <div
                  className="h-9 w-9 shrink-0 rounded-md border border-border/60"
                  style={{ backgroundColor: isValidColor ? watchedColor : 'transparent' }}
                  aria-hidden="true"
                />
              </div>
              <FormDescription>
                Pick from the palette or enter a custom hex code.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="-mx-6 -mb-6 flex flex-col-reverse gap-2 border-t bg-muted/30 px-6 py-4 sm:flex-row sm:justify-end sm:gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="sm:min-w-[160px]">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Save changes' : 'Create category'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
