import {z} from 'zod'

export const DeviceBreakInSearchSchema = z.object({
    weekNumber: z.string().optional(),
    description: z.string().optional(),
    page: z.number().optional()
})

export type DeviceBreakInSearch = z.infer<typeof DeviceBreakInSearchSchema>
