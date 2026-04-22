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
import { Button, buttonVariants } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  ArrowUpDown,
  MoreHorizontal,
  Pencil,
  Trash2,
  Wallet,
} from 'lucide-react'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import type { SavingsEntry } from '@/hooks/use-savings-entries'

interface EntriesTableProps {
  entries: SavingsEntry[]
  isLoading: boolean
  onEdit: (entry: SavingsEntry) => void
  onDelete: (entry: SavingsEntry) => void
}

export function EntriesTable({
  entries,
  isLoading,
  onEdit,
  onDelete,
}: EntriesTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'date', desc: true },
  ])

  const columns: ColumnDef<SavingsEntry>[] = useMemo(
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
        sortingFn: (a, b) =>
          new Date(a.original.date).getTime() -
          new Date(b.original.date).getTime(),
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
            }}
            className="-ml-3 h-8 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
          >
            Amount <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-mono text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
            +{formatCurrency(Number(row.original.amount))}
          </span>
        ),
        sortingFn: (a, b) =>
          Number(a.original.amount) - Number(b.original.amount),
      },
      {
        id: 'actions',
        header: () => (
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Actions
          </span>
        ),
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Open row actions"
              className={cn(
                buttonVariants({ variant: 'ghost', size: 'icon' }),
                'h-8 w-8',
              )}
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(row.original)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(row.original)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [sorting, onEdit, onDelete],
  )

  const table = useReactTable({
    data: entries,
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: { sorting },
    onSortingChange: setSorting,
  })

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <EmptyState
        icon={<Wallet />}
        title="No contributions yet"
        description="Use the Add funds button above to start saving toward this goal."
        className="border-0 bg-transparent"
      />
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border/80 bg-card">
      <Table>
        <TableHeader className="[&_tr]:border-b [&_tr]:shadow-[inset_0_-1px_0_var(--border)] [&_th]:h-12">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} className="first:pl-6">
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
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id} className="py-3 first:pl-6">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
