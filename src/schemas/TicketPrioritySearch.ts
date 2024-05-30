import {z} from 'zod'

export const TicketPrioritySearchSchema = z.object({
    code: z.string().optional(),
    name: z.string().optional(),
    description: z.string().optional(),
    page: z.number().optional()
})

export type TicketPrioritySearch = z.infer<typeof TicketPrioritySearchSchema>
