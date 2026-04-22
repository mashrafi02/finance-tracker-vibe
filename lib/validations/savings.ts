import { z } from 'zod'

export const createSavingsGoalSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  targetAmount: z.coerce
    .number()
    .positive('Target amount must be greater than 0')
    .max(999_999_999, 'Target amount is too large'),
})

export const updateSavingsGoalSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  targetAmount: z.coerce.number().positive().max(999_999_999).optional(),
})

export const createSavingsEntrySchema = z.object({
  amount: z.coerce
    .number()
    .positive('Amount must be greater than 0')
    .max(999_999_999, 'Amount is too large'),
  date: z.string().datetime({ message: 'Invalid date format' }),
})

export const updateSavingsEntrySchema = z.object({
  amount: z.coerce.number().positive().max(999_999_999).optional(),
  date: z.string().datetime().optional(),
})
