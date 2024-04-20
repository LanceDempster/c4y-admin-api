import {z} from 'zod'
export const UserSearchSchema = z.object({
    firstName: z.string().optional(),
    lastName : z.string().optional(),
    email: z.string().optional(),
    page: z.number().optional()
}) 

export type UserSearch = z.infer<typeof UserSearchSchema>