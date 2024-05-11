import {z} from 'zod'

export const MessageUpdateSchema = z.object({
    name: z.string().optional(),
    description: z.string().optional(),
})

export type MessageUpdate = z.infer<typeof MessageUpdateSchema>
