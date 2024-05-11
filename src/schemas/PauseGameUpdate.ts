import {z} from 'zod'

export const PauseGameUpdateSchema = z.object({
    name: z.string().optional(),
    description: z.string().optional(),
})

export type PauseGameUpdate = z.infer<typeof PauseGameUpdateSchema>
