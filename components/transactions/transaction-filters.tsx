'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { format } from 'date-fns'
import { CalendarIcon, Search, X, Check, ChevronsUpDown } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface Category {
  id: string
  name: string
  icon: string
  color: string
}

interface TransactionFiltersProps {
  categories: Category[]
}

export function TransactionFilters({ categories }: TransactionFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [dateFromOpen, setDateFromOpen] = useState(false)
  const [dateToOpen, setDateToOpen] = useState(false)
  const [categoriesOpen, setCategoriesOpen] = useState(false)

  // Parse current filters from URL params
  const currentFilters = {
    from: searchParams.get('from') || '',
    to: searchParams.get('to') || '',
    type: searchParams.get('type') || '',
    categoryId: searchParams.get('categoryId') || '',
    description: searchParams.get('description') || '',
  }

  const selectedCategories = currentFilters.categoryId
    ? currentFilters.categoryId.split(',').filter(Boolean)
    : []

  const selectedCategoriesData = categories.filter(cat => 
    selectedCategories.includes(cat.id)
  )

  const dateFrom = currentFilters.from ? new Date(currentFilters.from) : undefined
  const dateTo = currentFilters.to ? new Date(currentFilters.to) : undefined

  const updateFilters = (newFilters: Partial<typeof currentFilters>) => {
    const params = new URLSearchParams(searchParams.toString())
    
    Object.entries({ ...currentFilters, ...newFilters }).forEach(([key, value]) => {
      if (value && value.toString().trim()) {
        params.set(key, value.toString())
      } else {
        params.delete(key)
      }
    })

    // Reset to page 1 when filters change
    params.delete('page')
    
    router.push(`/transactions?${params.toString()}`)
  }

  const clearFilters = () => {
    router.push('/transactions')
  }

  const hasActiveFilters = Object.values(currentFilters).some(value => value && value.toString().trim())

  const toggleCategory = (categoryId: string) => {
    let newSelectedCategories: string[]
    
    if (selectedCategories.includes(categoryId)) {
      newSelectedCategories = selectedCategories.filter(id => id !== categoryId)
    } else {
      newSelectedCategories = [...selectedCategories, categoryId]
    }
    
    updateFilters({
      categoryId: newSelectedCategories.join(',')
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={currentFilters.description}
            onChange={(e) => updateFilters({ description: e.target.value })}
            className="h-9 w-44 rounded-full border-border/60 bg-card pl-8 text-sm shadow-xs focus-visible:ring-1"
          />
        </div>

        {/* Date From */}
        <Popover open={dateFromOpen} onOpenChange={setDateFromOpen}>
          <PopoverTrigger
            className={cn(
              'inline-flex h-9 items-center gap-1.5 rounded-full border border-border/60 bg-card px-3.5 text-sm font-medium shadow-xs transition-colors hover:bg-muted',
              !dateFrom && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="h-3.5 w-3.5" />
            {dateFrom ? format(dateFrom, 'MMM d, yyyy') : 'From date'}
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateFrom}
              onSelect={(date) => {
                updateFilters({ from: date ? format(date, 'yyyy-MM-dd') : '' })
                setDateFromOpen(false)
              }}
              disabled={(date) => {
                const today = new Date()
                const isAfterToday = date > today
                const isAfterToDate = dateTo ? date > dateTo : false
                return isAfterToday || isAfterToDate
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {/* Date To */}
        <Popover open={dateToOpen} onOpenChange={setDateToOpen}>
          <PopoverTrigger
            className={cn(
              'inline-flex h-9 items-center gap-1.5 rounded-full border border-border/60 bg-card px-3.5 text-sm font-medium shadow-xs transition-colors hover:bg-muted',
              !dateTo && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="h-3.5 w-3.5" />
            {dateTo ? format(dateTo, 'MMM d, yyyy') : 'To date'}
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateTo}
              onSelect={(date) => {
                updateFilters({ to: date ? format(date, 'yyyy-MM-dd') : '' })
                setDateToOpen(false)
              }}
              disabled={(date) => {
                const today = new Date()
                const isAfterToday = date > today
                const isBeforeFromDate = dateFrom ? date < dateFrom : false
                return isAfterToday || isBeforeFromDate
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {/* Type Filter */}
        <Select
          value={currentFilters.type}
          onValueChange={(value) => updateFilters({ type: value === 'all' ? '' : value || '' })}
        >
          <SelectTrigger className="h-9 w-32 rounded-full border-border/60 bg-card shadow-xs">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="INCOME">Income</SelectItem>
            <SelectItem value="EXPENSE">Expense</SelectItem>
          </SelectContent>
        </Select>

        {/* Categories Multi-Select */}
        <Popover open={categoriesOpen} onOpenChange={setCategoriesOpen}>
          <PopoverTrigger
            role="combobox"
            aria-expanded={categoriesOpen}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border/60 bg-card px-3.5 text-sm font-medium shadow-xs transition-colors hover:bg-muted"
          >
            {selectedCategories.length > 0
              ? `${selectedCategories.length} categor${selectedCategories.length === 1 ? 'y' : 'ies'}`
              : 'All categories'}
            <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
          </PopoverTrigger>
          <PopoverContent className="w-[280px] p-0">
            <Command>
              <CommandInput placeholder="Search categories..." />
              <CommandEmpty>No categories found.</CommandEmpty>
              <CommandList>
                <CommandGroup>
                  {categories.map((category) => (
                    <CommandItem
                      key={category.id}
                      onSelect={() => toggleCategory(category.id)}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          selectedCategories.includes(category.id) ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                      <span className="mr-2">{category.icon}</span>
                      <span>{category.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Clear */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border/60 bg-card px-3.5 text-sm font-medium text-muted-foreground shadow-xs transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </button>
        )}
      </div>

      {/* Selected category chips */}
      {selectedCategoriesData.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedCategoriesData.map((category) => (
            <span
              key={category.id}
              className="inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium"
              style={{ borderColor: `${category.color}40`, backgroundColor: `${category.color}15`, color: category.color }}
            >
              {category.icon}
              {category.name}
              <button
                aria-label={`Remove ${category.name} filter`}
                onClick={() => toggleCategory(category.id)}
                className="ml-0.5 opacity-60 hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}