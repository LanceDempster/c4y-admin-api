import {z} from 'zod'

export const StoryStatusUpdateSchema = z.object({
    status: z.string().optional(),
})

export type StoryStatusUpdate = z.infer<typeof StoryStatusUpdateSchema>
