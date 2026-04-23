import { z } from 'zod'

export const updateBalanceSchema = z.object({
  balance: z.coerce
    .number()
    .nonnegative('Balance must be zero or greater')
    .max(999_999_999, 'Balance is too large'),
})

export type UpdateBalanceInput = z.infer<typeof updateBalanceSchema>
