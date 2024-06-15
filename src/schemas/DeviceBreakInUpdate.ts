import {z} from 'zod'

export const DeviceBreakInUpdateSchema = z.object({
    weekNumber: z.string().optional(),
    description: z.string().optional(),
})

export type DeviceBreakInUpdate = z.infer<typeof DeviceBreakInUpdateSchema>
