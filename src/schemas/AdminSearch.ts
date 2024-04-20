import {z} from 'zod'
export const AdminSearchSchema = z.object({
    firstName: z.string().optional(),
    lastName : z.string().optional(),
    email: z.string().optional(),
    page: z.number().optional()
}) 

export type AdminSearch = z.infer<typeof AdminSearchSchema>