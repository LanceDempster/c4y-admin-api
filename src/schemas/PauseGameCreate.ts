import {z} from 'zod'

export const PauseGameCreateSchema = z.object({
    name: z.string({required_error: "name is required"}),
    description: z.string().optional(),
})

export type PauseGameCreate = z.infer<typeof PauseGameCreateSchema>
