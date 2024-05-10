import {z} from 'zod'

export const GameStatusSearchSchema = z.object({
    name: z.string().optional(),
    page: z.number().optional()
})

export type GameStatusSearch = z.infer<typeof GameStatusSearchSchema>
