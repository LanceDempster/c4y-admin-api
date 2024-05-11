import {z} from 'zod'

export const LockTypeSearchSchema = z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    page: z.number().optional()
})

export type LockTypeSearch = z.infer<typeof LockTypeSearchSchema>
