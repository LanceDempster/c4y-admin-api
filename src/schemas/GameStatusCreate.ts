import {z} from 'zod'

export const GameStatusCreateSchema = z.object({
    name: z.string({required_error: "name is required"}),
})

export type GameStatusCreate = z.infer<typeof GameStatusCreateSchema>
