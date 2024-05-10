import {z} from 'zod'

export const HealthCheckinCreateSchema = z.object({
    name: z.string({required_error: "name is required"}),
    description: z.string().optional(),
})

export type HealthCheckinCreate = z.infer<typeof HealthCheckinCreateSchema>
