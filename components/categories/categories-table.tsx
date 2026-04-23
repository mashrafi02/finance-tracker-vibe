'use client'

import { useState } from 'react'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  SortingState,
  useReactTable,
  ColumnFiltersState,
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
import { Input } from '@/components/ui/input'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useCategories } from '@/hooks/use-categories'
import { CategorySheet } from './category-sheet'
import { DeleteCategoryDialog } from './delete-category-dialog'
import type { Category } from '@/db/schema'

const columns: ColumnDef<Category>[] = [
  {
    accessorKey: 'icon',
    header: '',
    cell: ({ row }) => {
      const color = row.original.color
      return (
        <div
          className="flex h-9 w-9 items-center justify-center rounded-lg text-lg"
          style={{
            backgroundColor: `${color}20`,
            color: color,
          }}
        >
          {row.original.icon}
        </div>
      )
    },
    size: 60,
  },
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue('name')}</span>
    ),
  },
  {
    accessorKey: 'color',
    header: 'Color',
    cell: ({ row }) => {
      const color = row.getValue('color') as string
      return (
        <div className="flex items-center gap-2">
          <div
            className="h-4 w-4 rounded-full border"
            style={{ backgroundColor: color }}
          />
          <span className="font-mono text-xs text-muted-foreground">{color}</span>
        </div>
      )
    },
  },
]

interface CategoriesTableProps {
  initialData: Category[]
}

export function CategoriesTable({ initialData }: CategoriesTableProps) {
  const { categories, mutate } = useCategories()
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  // Sheet state
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | undefined>()

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingCategory, setDeletingCategory] = useState<Category | undefined>()

  const data = categories.length > 0 ? categories : initialData

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: { sorting, columnFilters },
    initialState: { pagination: { pageSize: 10 } },
  })

  function handleAddNew() {
    setEditingCategory(undefined)
    setSheetOpen(true)
  }

  function handleEdit(category: Category) {
    setEditingCategory(category)
    setSheetOpen(true)
  }

  function handleDelete(category: Category) {
    setDeletingCategory(category)
    setDeleteDialogOpen(true)
  }

  function handleSuccess() {
    mutate()
  }

  return (
    <div className="space-y-5">
      {/* Header with search and add button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Input
          placeholder="Search categories..."
          value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
          onChange={(e) => table.getColumn('name')?.setFilterValue(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={handleAddNew}>
          <Plus className="mr-2 h-4 w-4" />
          Add category
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-border/80 bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} style={{ width: header.column.getSize() }}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
                  <TableHead className="w-[88px]" />
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                  <TableCell>
                    <div className="flex items-center gap-0.5">
                      <button
                        aria-label="Edit category"
                        onClick={() => handleEdit(row.original)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        aria-label="Delete category"
                        onClick={() => handleDelete(row.original)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length + 1} className="h-32 text-center">
                  <div className="text-sm font-medium text-muted-foreground">No categories found.</div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">
          {table.getFilteredRowModel().rows.length} category(s)
        </p>
        {table.getPageCount() > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        )}
      </div>

      {/* Sheet for create/edit */}
      <CategorySheet
        isOpen={sheetOpen}
        onOpenChange={setSheetOpen}
        category={editingCategory}
        onSuccess={handleSuccess}
      />

      {/* Delete confirmation dialog */}
      {deletingCategory && (
        <DeleteCategoryDialog
          isOpen={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          categoryId={deletingCategory.id}
          categoryName={deletingCategory.name}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  )
}
