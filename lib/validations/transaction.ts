import { z } from 'zod'

export const createTransactionSchema = z.object({
  amount: z.coerce
    .number()
    .positive('Amount must be greater than 0')
    .max(999_999_999, 'Amount is too large'),
  type: z.enum(['INCOME', 'EXPENSE']),
  description: z.string().min(1, 'Description is required').max(200),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  categoryId: z.string().min(1, 'Please select a category'),
  note: z.string().max(500).optional().nullable(),
})

export const updateTransactionSchema = createTransactionSchema.partial()

export const transactionQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(10),
  sort: z.string().optional(),
  type: z.enum(['INCOME', 'EXPENSE']).optional(),
  categoryId: z.string().optional(), // Comma-separated category IDs
  description: z.string().optional(), // Text search for description/notes
})

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>
export type TransactionQueryInput = z.infer<typeof transactionQuerySchema>
