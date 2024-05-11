import {z} from 'zod'

export const MessageCreateSchema = z.object({
    name: z.string({required_error: "name is required"}),
    description: z.string().optional(),
})

export type MessageCreate = z.infer<typeof MessageCreateSchema>
