import {z} from 'zod'

export const MessageSearchSchema = z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    page: z.number().optional()
})

export type MessageSearch = z.infer<typeof MessageSearchSchema>
