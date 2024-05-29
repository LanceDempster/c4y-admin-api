import {z} from 'zod'

export const TicketStatusUpdateSchema = z.object({
    name: z.string().optional(),
    description: z.string().optional(),
})

export type TicketStatusUpdate = z.infer<typeof TicketStatusUpdateSchema>
