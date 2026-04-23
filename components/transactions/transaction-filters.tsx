'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { format } from 'date-fns'
import { CalendarIcon, Search, Filter, X, Check, ChevronsUpDown } from 'lucide-react'
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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
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
    <Card>
      <CardContent className="p-5">
        <div className="flex flex-col space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Filter className="h-4 w-4" />
              </span>
              <h3 className="text-sm font-semibold tracking-wide">Filters</h3>
            </div>
            {hasActiveFilters && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearFilters}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="mr-1 h-3 w-3" />
                Clear
              </Button>
            )}
          </div>

          {/* Filters Grid */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={currentFilters.description}
                onChange={(e) => updateFilters({ description: e.target.value })}
                className="pl-9"
              />
            </div>

            {/* Date From */}
            <Popover open={dateFromOpen} onOpenChange={setDateFromOpen}>
              <PopoverTrigger
                className={cn(
                  buttonVariants({ variant: 'outline' }),
                  'w-full justify-start text-left font-medium',
                  !dateFrom && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
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
                  buttonVariants({ variant: 'outline' }),
                  'w-full justify-start text-left font-medium',
                  !dateTo && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
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
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent className="p-2 h-26!">
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
                className={cn(
                  buttonVariants({ variant: 'outline' }),
                  'w-full justify-between font-medium'
                )}
              >
                {selectedCategories.length > 0
                  ? `${selectedCategories.length} selected`
                  : 'All categories'}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0">
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
                              "mr-2 h-4 w-4",
                              selectedCategories.includes(category.id)
                                ? "opacity-100"
                                : "opacity-0"
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
          </div>

          {/* Selected Categories Display */}
          {selectedCategoriesData.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedCategoriesData.map((category) => (
                <Badge
                  key={category.id}
                  variant="secondary"
                  className="h-7 pr-1"
                  style={{ backgroundColor: `${category.color}20`, color: category.color }}
                >
                  <span className="mr-1">{category.icon}</span>
                  {category.name}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-1 h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => toggleCategory(category.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}