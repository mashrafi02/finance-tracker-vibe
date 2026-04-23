import { z } from 'zod'

export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must not exceed 50 characters'),
  bio: z.string().max(160, 'Bio must not exceed 160 characters').optional(),
  imageUrl: z.string().url().nullable().optional(),
})

export const updateNameSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters')
    .regex(/[A-Z]/, 'New password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'New password must contain at least one number'),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type UpdateNameInput = z.infer<typeof updateNameSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
