import {z} from 'zod'

export const TicketStatusCreateSchema = z.object({
    name: z.string({required_error: "name is required"}),
    description: z.string().optional(),
})

export type TicketStatusCreate = z.infer<typeof TicketStatusCreateSchema>
