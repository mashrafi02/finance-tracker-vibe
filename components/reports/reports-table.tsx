'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
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
import { EmptyState } from '@/components/ui/empty-state'
import { Plus, Eye, Trash2, Loader2, FileText } from 'lucide-react'
import { useReports, type ReportListItem } from '@/hooks/use-reports'
import { ReportViewDialog } from './report-view-dialog'
import { DeleteReportDialog } from './delete-report-dialog'

function formatMonthLong(month: string) {
  const [year, m] = month.split('-')
  const date = new Date(parseInt(year), parseInt(m) - 1)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
}

function formatGeneratedDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function getCurrentMonth() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

const GENERATE_LOCK_KEY = 'reports:lastGeneratedAt'
const GENERATE_LOCK_MS = 24 * 60 * 60 * 1000 // 24 hours

function formatCountdown(ms: number) {
  const totalMinutes = Math.ceil(ms / (60 * 1000))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

export function ReportsTable() {
  const { reports, isLoading, mutate } = useReports()
  const [sorting, setSorting] = useState<SortingState>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [lockRemainingMs, setLockRemainingMs] = useState(0)

  // Check & refresh the generation lock every minute
  useEffect(() => {
    const check = () => {
      if (typeof window === 'undefined') return
      const raw = window.localStorage.getItem(GENERATE_LOCK_KEY)
      if (!raw) {
        setLockRemainingMs(0)
        return
      }
      const last = parseInt(raw, 10)
      if (Number.isNaN(last)) {
        setLockRemainingMs(0)
        return
      }
      const elapsed = Date.now() - last
      const remaining = GENERATE_LOCK_MS - elapsed
      setLockRemainingMs(remaining > 0 ? remaining : 0)
    }
    check()
    const interval = setInterval(check, 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const isLocked = lockRemainingMs > 0

  // Dialog states
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [viewingReportId, setViewingReportId] = useState<string | null>(null)

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingReport, setDeletingReport] = useState<ReportListItem | null>(null)

  const columns: ColumnDef<ReportListItem>[] = [
    {
      accessorKey: 'month',
      header: 'Month',
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400">
            <FileText className="h-4 w-4" />
          </div>
          <span className="font-medium">{formatMonthLong(row.original.month)}</span>
        </div>
      ),
    },
    {
      accessorKey: 'generatedAt',
      header: 'Generated on',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatGeneratedDate(row.original.generatedAt)}
        </span>
      ),
    },
  ]

  const table = useReactTable({
    data: reports,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
    initialState: {
      pagination: { pageSize: 10 },
      sorting: [{ id: 'month', desc: true }],
    },
  })

  async function handleGenerateCurrent() {
    if (isLocked) {
      toast.error(
        `You can generate a new report in ${formatCountdown(lockRemainingMs)}.`,
      )
      return
    }

    const month = getCurrentMonth()
    setIsGenerating(true)

    try {
      const res = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        if (res.status === 409) {
          toast.error(`A report for ${formatMonthLong(month)} already exists.`)
        } else {
          toast.error(data.error ?? 'Failed to generate report')
        }
        return
      }

      // Record the successful generation time to enforce the 24h lock
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(GENERATE_LOCK_KEY, Date.now().toString())
        setLockRemainingMs(GENERATE_LOCK_MS)
      }

      toast.success(`${formatMonthLong(month)} report generated`)
      mutate()
    } catch {
      toast.error('Failed to generate report. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  function handleView(report: ReportListItem) {
    setViewingReportId(report.id)
    setViewDialogOpen(true)
  }

  function handleDelete(report: ReportListItem) {
    setDeletingReport(report)
    setDeleteDialogOpen(true)
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">
          {isLoading
            ? 'Loading reports...'
            : `${reports.length} report${reports.length === 1 ? '' : 's'}`}
        </p>
        <Button onClick={handleGenerateCurrent} disabled={isGenerating || isLocked}>
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : isLocked ? (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Available in {formatCountdown(lockRemainingMs)}
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Generate current month
            </>
          )}
        </Button>
      </div>

      {/* Table or empty state */}
      {!isLoading && reports.length === 0 ? (
        <div className="rounded-2xl border border-border/80 bg-card">
          <EmptyState
            icon={<FileText />}
            title="No reports yet"
            description="Generate your first monthly financial report to get started."
            action={
              <Button onClick={handleGenerateCurrent} disabled={isGenerating || isLocked}>
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : isLocked ? (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Available in {formatCountdown(lockRemainingMs)}
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Generate current month
                  </>
                )}
              </Button>
            }
            className="py-12"
          />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border/80 bg-card">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  ))}
                  <TableHead className="w-[88px]" />
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={columns.length + 1} className="h-24 text-center">
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading reports...
                    </div>
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="cursor-pointer"
                    onClick={() => handleView(row.original)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-0.5">
                        <button
                          aria-label="View report"
                          onClick={() => handleView(row.original)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          aria-label="Delete report"
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
                    <div className="text-sm font-medium text-muted-foreground">
                      No reports found.
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-end gap-2">
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

      {/* View dialog */}
      <ReportViewDialog
        key={viewingReportId ?? ''}
        isOpen={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        reportId={viewingReportId}
      />

      {/* Delete dialog */}
      {deletingReport && (
        <DeleteReportDialog
          isOpen={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          reportId={deletingReport.id}
          monthLabel={formatMonthLong(deletingReport.month)}
          onSuccess={() => mutate()}
        />
      )}
    </div>
  )
}
