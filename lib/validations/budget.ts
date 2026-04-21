import { z } from 'zod'

export const createBudgetSchema = z.object({
  categoryId: z.string().min(1, 'Category is required'),
  limit: z.coerce
    .number()
    .positive('Limit must be greater than 0')
    .max(999_999_999, 'Limit is too large'),
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Month must be in YYYY-MM format'),
})

export const updateBudgetSchema = z.object({
  limit: z.coerce
    .number()
    .positive('Limit must be greater than 0')
    .max(999_999_999, 'Limit is too large'),
})

export const budgetQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Month must be in YYYY-MM format'),
})

export type CreateBudgetInput = z.infer<typeof createBudgetSchema>
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>
export type BudgetQueryInput = z.infer<typeof budgetQuerySchema>
