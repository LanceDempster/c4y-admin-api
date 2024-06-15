import {z} from 'zod'

export const ToyCreateSchema = z.object({
    name: z.string({required_error: "name is required"}),
    description: z.string({required_error: "description is required"}),
    toyImage: z.string({required_error: "toy image is required"}),
    toyUrl: z.string({required_error: "toy url is required"}),
})

export type ToyCreate = z.infer<typeof ToyCreateSchema>
