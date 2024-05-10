import {z} from 'zod'

export const GameStatusUpdateSchema = z.object({
    name: z.string().optional(),
})

export type GameStatusUpdate = z.infer<typeof GameStatusUpdateSchema>
