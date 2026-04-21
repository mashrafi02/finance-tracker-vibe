'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useTransactions, type TransactionWithCategory } from '@/hooks/use-transactions'
import { useCategories } from '@/hooks/use-categories'
import { TransactionsTable } from '@/components/transactions/transactions-table'
import { TransactionSheet, NewTransactionButton } from '@/components/transactions/transaction-sheet'
import { DeleteTransactionDialog } from '@/components/transactions/delete-transaction-dialog'
import { TransactionFilters } from '@/components/transactions/transaction-filters'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ReceiptText } from 'lucide-react'
import { Reveal } from '@/components/ui/reveal'

export default function TransactionsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [sort, setSort] = useState('date.desc')
  // Open the sheet immediately if the page lands with `?new=1`.
  const [sheetOpen, setSheetOpen] = useState(() => searchParams.get('new') === '1')
  const [editingTransaction, setEditingTransaction] = useState<TransactionWithCategory | undefined>()
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // Parse filters from URL parameters
  const page = parseInt(searchParams.get('page') || '1', 10)
  const filters = {
    from: searchParams.get('from') || undefined,
    to: searchParams.get('to') || undefined,
    type: (searchParams.get('type') as 'INCOME' | 'EXPENSE') || undefined,
    categoryId: searchParams.get('categoryId') || undefined,
    description: searchParams.get('description') || undefined,
  }

  const { transactions, meta, isLoading, mutate } = useTransactions({
    page,
    pageSize: 10,
    sort,
    ...filters,
  })
  const { categories, isLoading: categoriesLoading } = useCategories()

  // Strip `?new=1` from the URL after it's consumed (the sheet opens via
  // initial state above). We only touch the external router here — no setState.
  useEffect(() => {
    if (searchParams.get('new') !== '1') return
    const params = new URLSearchParams(searchParams.toString())
    params.delete('new')
    const qs = params.toString()
    router.replace(qs ? `/transactions?${qs}` : '/transactions')
  }, [searchParams, router])

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString())
    if (newPage > 1) {
      params.set('page', newPage.toString())
    } else {
      params.delete('page')
    }
    router.push(`/transactions?${params.toString()}`)
  }

  const handleEdit = (transaction: TransactionWithCategory) => {
    setEditingTransaction(transaction)
    setSheetOpen(true)
  }

  const handleSheetClose = (open: boolean) => {
    setSheetOpen(open)
    if (!open) {
      setEditingTransaction(undefined)
    }
  }

  const handleSuccess = () => {
    mutate()
    setEditingTransaction(undefined)
  }

  if (categoriesLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-36" />
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-7">
      <Reveal
        as="section"
        className="rounded-3xl border border-border/70 bg-card px-6 py-7 shadow-[0_12px_34px_rgba(0,0,0,0.04)] sm:px-8"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <ReceiptText className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">Transactions</h1>
              <p className="mt-1 text-sm font-medium text-muted-foreground">
                View and manage your income and expenses.
              </p>
            </div>
          </div>
          <NewTransactionButton
            categories={categories}
            open={sheetOpen && !editingTransaction}
            onOpenChange={(open) => {
              if (!open) setEditingTransaction(undefined)
              setSheetOpen(open)
            }}
            onSuccess={handleSuccess}
          />
        </div>
      </Reveal>

      <Reveal delay={80} className="space-y-5">
        <TransactionFilters categories={categories} />

        <TransactionsTable
          data={transactions}
          pageCount={meta.totalPages}
          page={meta.page}
          pageSize={meta.pageSize}
          total={meta.total}
          onPageChange={handlePageChange}
          onSortChange={setSort}
          onEdit={handleEdit}
          onDelete={setDeleteId}
          isLoading={isLoading}
        />
      </Reveal>

      {/* Edit Sheet */}
      {editingTransaction && (
        <TransactionSheet
          categories={categories}
          transaction={editingTransaction}
          open={sheetOpen}
          onOpenChange={handleSheetClose}
          onSuccess={handleSuccess}
        />
      )}

      {/* Delete Dialog */}
      <DeleteTransactionDialog
        transactionId={deleteId}
        open={Boolean(deleteId)}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onSuccess={handleSuccess}
      />
    </div>
  )
}
