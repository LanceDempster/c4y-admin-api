import {z} from 'zod'

export const TicketCategorySearchSchema = z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    page: z.number().optional()
})

export type TicketCategorySearch = z.infer<typeof TicketCategorySearchSchema>
