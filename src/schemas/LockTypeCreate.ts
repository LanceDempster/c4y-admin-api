import {z} from 'zod'

export const LockTypeCreateSchema = z.object({
    name: z.string({required_error: "name is required"}),
    description: z.string().optional(),
})

export type LockTypeCreate = z.infer<typeof LockTypeCreateSchema>
