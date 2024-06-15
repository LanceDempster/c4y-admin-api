import {z} from 'zod'

export const DeviceBreakInCreateSchema = z.object({
    weekNumber: z.string({required_error: "Week Number is required"}),
    description: z.string().optional(),
})

export type DeviceBreakInCreate = z.infer<typeof DeviceBreakInCreateSchema>
