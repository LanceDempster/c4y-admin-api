import {z} from 'zod'

export const DeviceTypeCreateSchema = z.object({
    name: z.string({required_error: "name is required"}),
    description: z.string().optional(),
})

export type DeviceTypeCreate = z.infer<typeof DeviceTypeCreateSchema>
