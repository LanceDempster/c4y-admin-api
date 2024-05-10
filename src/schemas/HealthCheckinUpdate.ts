import {z} from 'zod'

export const HealthCheckingUpdateSchema = z.object({
    name: z.string().optional(),
    description: z.string().optional(),
})

export type HealthCheckinUpdate = z.infer<typeof HealthCheckingUpdateSchema>
