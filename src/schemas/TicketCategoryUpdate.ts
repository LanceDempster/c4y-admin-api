import {z} from 'zod'

export const TicketCategoryUpdateSchema = z.object({
    name: z.string().optional(),
    description: z.string().optional(),
})

export type TicketCategoryUpdate = z.infer<typeof TicketCategoryUpdateSchema>
