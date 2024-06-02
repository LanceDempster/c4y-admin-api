import {z} from 'zod'

export const TicketSearchSchema = z.object({
    userId: z.number().optional(),
    userEmail: z.string().optional(),
    title: z.string().optional(),
    description: z.string().optional(),
    categoryId: z.number().optional(),
    statusId: z.number().optional(),
    priorityId: z.number().optional(),
    page: z.number().optional()
})

export type TicketSearch = z.infer<typeof TicketSearchSchema>
