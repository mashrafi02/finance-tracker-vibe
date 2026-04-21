import { z } from 'zod'

export const summaryAnalyticsQuerySchema = z.object({
  range: z.enum(['weekly', 'monthly', 'yearly']).default('monthly'),
})

export const spendingAnalyticsQuerySchema = z.object({
  range: z.enum(['weekly', 'monthly']).default('monthly'),
})
