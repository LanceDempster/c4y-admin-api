import {z} from 'zod'
export const UserProductSearchSchema = z.object({
    page: z.number().optional(),
    orderBy: z.string().optional(),
    orderDirection: z.string().optional(),
})

export type UserProductSearch = z.infer<typeof UserProductSearchSchema>
