import { z } from 'zod'

export const summaryQuerySchema = z.object({
  range: z.enum(['weekly', 'monthly', 'yearly']).default('monthly'),
})

export type SummaryQueryInput = z.infer<typeof summaryQuerySchema>
