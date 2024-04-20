import {z} from 'zod'
export const UserUpdateSchema = z.object({
    firstName: z.string().optional(),
    lastName : z.string().optional(),
    country: z.string().optional(),
    dateOfBirth: z.coerce.date().optional(),
    gender: z.enum(['MALE', 'FEMALE']).optional()
}) 

export type UserUpdate = z.infer<typeof UserUpdateSchema>