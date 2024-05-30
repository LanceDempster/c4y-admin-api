import {z} from 'zod'

export const TicketPriorityUpdateSchema = z.object({
    code: z.string().optional(),
    name: z.string().optional(),
    description: z.string().optional(),
})

export type TicketPriorityUpdate = z.infer<typeof TicketPriorityUpdateSchema>
