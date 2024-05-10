import {z} from 'zod'

export const DeviceTypeSearchSchema = z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    page: z.number().optional()
})

export type DeviceTypeSearch = z.infer<typeof DeviceTypeSearchSchema>
