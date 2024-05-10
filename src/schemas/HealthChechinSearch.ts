import {z} from 'zod'

export const HealthCheckinSearchSchema = z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    page: z.number().optional()
})

export type HealthChechinSearch = z.infer<typeof HealthCheckinSearchSchema>
