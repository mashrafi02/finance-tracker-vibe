import { z } from 'zod'

export const summaryAnalyticsQuerySchema = z.object({
  range: z.enum(['weekly', 'monthly', 'yearly']).default('monthly'),
})

export const spendingAnalyticsQuerySchema = z.object({
  range: z.enum(['weekly', 'monthly']).default('monthly'),
})

export const overviewAnalyticsQuerySchema = z.object({
  range: z.enum(['7d', '30d', '90d', '365d', 'all']).default('90d'),
})

export type OverviewAnalyticsQuery = z.infer<typeof overviewAnalyticsQuerySchema>
