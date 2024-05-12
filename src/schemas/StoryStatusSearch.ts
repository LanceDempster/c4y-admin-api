import {z} from 'zod'

export const StoryStatusSearchSchema = z.object({
    status: z.string().optional(),
    page: z.number().optional()
})

export type StoryStatusSearch = z.infer<typeof StoryStatusSearchSchema>
