import {z} from 'zod'
export const AdminUpdateSchema = z.object({
    firstName: z.string().optional(),
    lastName : z.string().optional()
}) 

export type AdminUpdate = z.infer<typeof AdminUpdateSchema>