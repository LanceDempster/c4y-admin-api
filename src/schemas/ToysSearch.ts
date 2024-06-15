import {z} from 'zod'

export const ToySearchSchema = z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    toysImage: z.string().optional(),
    toysUrl: z.string().optional(),
    page: z.number().optional()
})

export type ToySearch = z.infer<typeof ToySearchSchema>
