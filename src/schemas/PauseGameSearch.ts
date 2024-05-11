import {z} from 'zod'

export const PauseSearchSchema = z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    page: z.number().optional()
})

export type PauseGameSearch = z.infer<typeof PauseSearchSchema>
