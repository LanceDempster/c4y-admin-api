import {z} from 'zod'

export const ToyUpdateSchema = z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    ToysImage: z.string().optional(),
    ToysUrl: z.string().optional(),
})

export type ToyUpdate = z.infer<typeof ToyUpdateSchema>
