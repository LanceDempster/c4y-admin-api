import {z} from 'zod'

export const TicketUpdateSchema = z.object({
		userId: z.number().optional(),
    staffId: z.number().optional(),
    staffName: z.string().optional(),
    userEmail: z.string(),
		categoryId: z.number(),
		priorityId: z.number(),
		statusId: z.number(),
})

export type TicketUpdate = z.infer<typeof TicketUpdateSchema>
