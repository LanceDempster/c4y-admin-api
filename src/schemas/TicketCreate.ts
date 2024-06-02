import {z} from 'zod'

export const TicketCreateSchema = z.object({
		userId: z.number().optional(),
    staffId: z.number().optional(),
    staffName: z.string().optional(),
    userEmail: z.string(),
    title: z.string(),
    description: z.string().optional(),
		categoryId: z.number(),
		priorityId: z.number(),
		statusId: z.number(),
})

export type TicketCreate = z.infer<typeof TicketCreateSchema>
