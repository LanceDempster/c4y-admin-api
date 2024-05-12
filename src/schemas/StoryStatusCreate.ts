import {z} from 'zod'

export const StoryStatusCreateSchema = z.object({
    status: z.string({required_error: "status is required"}),
})

export type StoryStatusCreate = z.infer<typeof StoryStatusCreateSchema>
