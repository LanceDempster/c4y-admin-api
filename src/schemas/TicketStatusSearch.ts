import {z} from 'zod'

export const TicketStatusSearchSchema = z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    page: z.number().optional()
})

export type TicketStatusSearch = z.infer<typeof TicketStatusSearchSchema>
