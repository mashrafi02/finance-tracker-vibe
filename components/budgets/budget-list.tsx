'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Trash2, Save, Pencil, PiggyBank } from 'lucide-react'
import { useBudgets, type BudgetStatus } from '@/hooks/use-budgets'
import { formatCurrency, cn } from '@/lib/utils'
import { toast } from 'sonner'

// Generate month options for current and next month
function getMonthOptions() {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonthIndex = now.getMonth() // 0-based (0 = January)
  
  // Current month
  const currentMonth = `${currentYear}-${String(currentMonthIndex + 1).padStart(2, '0')}`
  
  // Next month (handle year rollover)
  let nextYear = currentYear
  let nextMonthIndex = currentMonthIndex + 1
  if (nextMonthIndex > 11) {
    nextYear += 1
    nextMonthIndex = 0
  }
  const nextMonth = `${nextYear}-${String(nextMonthIndex + 1).padStart(2, '0')}`
  
  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-')
    return new Intl.DateTimeFormat('en-US', { 
      month: 'long', 
      year: 'numeric' 
    }).format(new Date(parseInt(year), parseInt(month) - 1))
  }

  return [
    { value: currentMonth, label: formatMonth(currentMonth) },
    { value: nextMonth, label: formatMonth(nextMonth) },
  ]
}

interface BudgetItemProps {
  budget: BudgetStatus
  onSave: (categoryId: string, limit: number) => Promise<void>
  onDelete: (budgetId: string) => Promise<void>
}

function BudgetItem({ budget, onSave, onDelete }: BudgetItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [limitValue, setLimitValue] = useState(budget.limit?.toString() ?? '')
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleSave = async () => {
    const limit = parseFloat(limitValue)
    if (isNaN(limit) || limit <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    setIsSaving(true)
    try {
      await onSave(budget.categoryId, limit)
      setIsEditing(false)
      toast.success('Budget saved')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save budget')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!budget.budgetId) return
    
    setIsDeleting(true)
    try {
      await onDelete(budget.budgetId)
      toast.success('Budget removed')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to remove budget')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleEdit = () => {
    setLimitValue(budget.limit?.toString() ?? '')
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setLimitValue(budget.limit?.toString() ?? '')
  }

  const progressPercentage = budget.percentageUsed ?? 0
  const isOverBudget = budget.isOverspent
  const isWarning = progressPercentage >= 80 && !isOverBudget

  return (
    <Card className="bg-gradient-to-b from-card to-muted/15">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base font-semibold tracking-tight">
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl text-sm"
              style={{
                backgroundColor: `${budget.categoryColor}20`,
                color: budget.categoryColor,
              }}
            >
              {budget.categoryIcon}
            </div>
            <span>{budget.categoryName}</span>
          </div>
          {budget.limit && (
            <div className="flex items-center gap-2">
              {!isEditing && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={handleEdit}
                  disabled={isSaving || isDeleting}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={handleDelete}
                disabled={isSaving || isDeleting || !budget.budgetId}
              >
                {isDeleting ? (
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-destructive border-t-transparent" />
                ) : (
                  <Trash2 className="h-3 w-3" />
                )}
              </Button>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Budget input */}
        <div className="flex items-center gap-2">
          {isEditing ? (
            <div className="flex flex-1 items-center gap-2">
              <Input
                type="number"
                step="0.01"
                placeholder="Enter budget limit"
                value={limitValue}
                onChange={(e) => setLimitValue(e.target.value)}
                className="flex-1"
                disabled={isSaving}
              />
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <Save className="h-3 w-3" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                disabled={isSaving}
              >
                Cancel
              </Button>
            </div>
          ) : budget.limit ? (
            <div className="flex flex-1 items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Budget: {formatCurrency(budget.limit)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEdit}
                disabled={isSaving || isDeleting}
              >
                Edit
              </Button>
            </div>
          ) : (
            <div className="flex flex-1 items-center gap-2">
              <Input
                type="number"
                step="0.01"
                placeholder="Set budget limit"
                value={limitValue}
                onChange={(e) => setLimitValue(e.target.value)}
                className="flex-1"
                disabled={isSaving}
              />
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving || !limitValue}
              >
                {isSaving ? (
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <Save className="h-3 w-3" />
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Progress and spending info */}
        {budget.limit && (
            <div className="space-y-2">
            <Progress
              value={Math.min(progressPercentage, 100)}
              className={cn(
                'h-2',
                isOverBudget
                  ? '[&>div]:bg-destructive'
                  : isWarning
                  ? '[&>div]:bg-amber-500'
                  : '[&>div]:bg-primary'
              )}
            />
            <div className="flex items-center justify-between text-sm">
              <span className={cn(
                'font-semibold',
                isOverBudget
                  ? 'text-destructive'
                  : isWarning
                  ? 'text-amber-700 dark:text-amber-400'
                  : 'text-muted-foreground'
              )}>
                {formatCurrency(budget.spent)} spent
              </span>
              <span className="text-muted-foreground">
                {budget.remaining !== null && budget.remaining >= 0
                  ? `${formatCurrency(budget.remaining)} left`
                  : `${formatCurrency(Math.abs(budget.remaining || 0))} over budget`
                }
              </span>
            </div>
            {isOverBudget && (
              <p className="text-xs text-destructive">
                You have exceeded your budget by {formatCurrency(Math.abs(budget.remaining || 0))}
              </p>
            )}
            {isWarning && (
              <p className="text-xs text-amber-700 dark:text-amber-400">
                You have used {progressPercentage}% of your budget
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function BudgetListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-48" />
      </div>
      <div className="grid gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <Skeleton className="h-5 w-32" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-2 w-full" />
              <div className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export function BudgetList() {
  const monthOptions = getMonthOptions()
  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0].value)
  
  const { budgets, isLoading, createOrUpdateBudget, deleteBudget } = useBudgets(selectedMonth)

  const handleSave = async (categoryId: string, limit: number) => {
    await createOrUpdateBudget(categoryId, limit, selectedMonth)
  }

  const handleDelete = async (budgetId: string) => {
    await deleteBudget(budgetId)
  }

  if (isLoading) {
    return <BudgetListSkeleton />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <PiggyBank className="h-5 w-5" />
            Budget Management
          </h2>
          <p className="mt-1 text-sm font-medium text-muted-foreground">
            Set monthly spending limits for your categories
          </p>
        </div>
        <Select 
          value={selectedMonth} 
          onValueChange={(value) => {
            if (value) setSelectedMonth(value)
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select month" />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {budgets.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground">
                  No categories found. Create some categories first to set budgets.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          budgets.map((budget) => (
            <BudgetItem
              key={budget.categoryId}
              budget={budget}
              onSave={handleSave}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>
    </div>
  )
}