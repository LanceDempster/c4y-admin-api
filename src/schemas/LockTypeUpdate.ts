import {z} from 'zod'

export const LockTypeUpdateSchema = z.object({
    name: z.string().optional(),
    description: z.string().optional(),
})

export type LockTypeUpdate = z.infer<typeof LockTypeUpdateSchema>
