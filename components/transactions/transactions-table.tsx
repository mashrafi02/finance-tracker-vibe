'use client'

import { useMemo, useState } from 'react'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  SortingState,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Pencil,
  ReceiptText,
  Trash2,
} from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'
import { useCurrency } from '@/contexts/currency-context'
import type { TransactionWithCategory } from '@/hooks/use-transactions'

interface TransactionsTableProps {
  data: TransactionWithCategory[]
  pageCount: number
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  onSortChange: (sort: string) => void
  onEdit: (transaction: TransactionWithCategory) => void
  onDelete: (id: string) => void
  isLoading: boolean
}

export function TransactionsTable({
  data,
  pageCount,
  page,
  pageSize,
  total,
  onPageChange,
  onSortChange,
  onEdit,
  onDelete,
  isLoading,
}: TransactionsTableProps) {
  const { formatCurrency } = useCurrency()
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'date', desc: true },
  ])

  const columns: ColumnDef<TransactionWithCategory>[] = useMemo(
    () => [
      {
        accessorKey: 'date',
        header: () => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const isDesc = sorting[0]?.id === 'date' && sorting[0]?.desc
              setSorting([{ id: 'date', desc: !isDesc }])
              onSortChange(`date.${isDesc ? 'asc' : 'desc'}`)
            }}
            className="-ml-3 h-8 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
          >
            Date <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="text-sm font-medium text-muted-foreground">
            {formatDate(row.original.date)}
          </span>
        ),
      },
      {
        accessorKey: 'description',
        header: 'Description',
        cell: ({ row }) => {
          const parts = row.original.description.split(' | ')
          return <span className="font-semibold tracking-tight">{parts[0]}</span>
        },
      },
      {
        accessorKey: 'category',
        header: 'Category',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span>{row.original.category.icon}</span>
            <span className="text-sm font-medium text-muted-foreground">
              {row.original.category.name}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ row }) => {
          const type = row.original.type
          return (
            <Badge
              variant="secondary"
              className={cn(
                type === 'INCOME'
                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : 'bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400',
              )}
            >
              {type === 'INCOME' ? 'Income' : 'Expense'}
            </Badge>
          )
        },
      },
      {
        accessorKey: 'amount',
        header: () => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const isDesc = sorting[0]?.id === 'amount' && sorting[0]?.desc
              setSorting([{ id: 'amount', desc: !isDesc }])
              onSortChange(`amount.${isDesc ? 'asc' : 'desc'}`)
            }}
            className="-ml-3 h-8 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
          >
            Amount <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => {
          const type = row.original.type
          const amount = Number(row.original.amount)
          return (
            <span
              className={cn(
                'font-mono text-sm font-semibold tabular-nums',
                type === 'INCOME'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-red-600 dark:text-red-400',
              )}
            >
              {type === 'INCOME' ? '+' : '−'}
              {formatCurrency(amount)}
            </span>
          )
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        enableHiding: false,
        cell: ({ row }) => (
          <div className="flex items-center gap-0.5">
            <button
              aria-label="Edit transaction"
              onClick={() => onEdit(row.original)}
              className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'h-8 w-8 text-muted-foreground hover:text-foreground')}
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              aria-label="Delete transaction"
              onClick={() => onDelete(row.original.id)}
              className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10')}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ),
      },
    ],
    [sorting, onSortChange, onEdit, onDelete, formatCurrency],
  )

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    pageCount,
    state: {
      sorting,
      pagination: { pageIndex: page - 1, pageSize },
    },
  })

  if (isLoading) {
    return <TransactionsTableSkeleton />
  }

  return (
    <div className="space-y-4">
      {/* Mobile card stack — visible below md */}
      <div className="space-y-2 md:hidden">
        {data.length === 0 ? (
          <EmptyState
            icon={<ReceiptText />}
            title="No transactions found"
            description="Try adjusting your filters, or add your first transaction."
          />
        ) : (
          data.map((tx) => {
            const parts = tx.description.split(' | ')
            return (
              <div
                key={tx.id}
                className="rounded-2xl border border-border/80 bg-card p-3.5 shadow-xs transition-colors hover:bg-muted/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-lg">
                      {tx.category.icon}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold tracking-tight">{parts[0]}</p>
                      <p className="truncate text-xs font-medium text-muted-foreground">
                        {tx.category.name} • {formatDate(tx.date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <span
                      className={cn(
                        'font-mono text-sm font-semibold tabular-nums',
                        tx.type === 'INCOME'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-red-600 dark:text-red-400',
                      )}
                    >
                      {tx.type === 'INCOME' ? '+' : '−'}
                      {formatCurrency(Number(tx.amount))}
                    </span>
                    <div className="flex items-center gap-0.5">
                        <button
                          aria-label="Edit transaction"
                          onClick={() => onEdit(tx)}
                          className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'h-7 w-7 text-muted-foreground hover:text-foreground')}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          aria-label="Delete transaction"
                          onClick={() => onDelete(tx.id)}
                          className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'h-7 w-7 text-muted-foreground hover:bg-destructive/10 hover:text-destructive')}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Desktop table — md and up */}
      <div className="hidden overflow-hidden rounded-2xl border border-border/80 bg-card md:block">
        <Table>
            <TableHeader className="[&_tr]:border-b [&_tr]:shadow-[inset_0_-1px_0_var(--border)] [&_th]:h-14">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="first:pl-12">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className={cn('p-3 py-3', 'first:pl-12')}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-40 p-0">
                    <EmptyState
                      icon={<ReceiptText />}
                      title="No transactions found"
                      description="Try adjusting your filters, or add your first transaction."
                      className="border-0 bg-transparent"
                    />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">
          {total} transaction{total !== 1 ? 's' : ''}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {pageCount || 1}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= pageCount}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function TransactionsTableSkeleton() {
  return (
    <div className="space-y-4">
      {/* Mobile skeleton */}
      <div className="space-y-2 md:hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border/80 bg-card p-3.5 shadow-xs">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        ))}
      </div>
      {/* Desktop skeleton */}
      <div className="hidden overflow-hidden rounded-2xl border border-border/80 bg-card md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-40" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-16 rounded-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-20" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-8 w-8" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
