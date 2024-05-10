import {z} from 'zod'

export const DeviceTypeUpdateSchema = z.object({
    name: z.string().optional(),
    description: z.string().optional(),
})

export type DeviceTypeUpdate = z.infer<typeof DeviceTypeUpdateSchema>
