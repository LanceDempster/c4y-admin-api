import {z} from 'zod'

export const TicketCategoryCreateSchema = z.object({
    name: z.string({required_error: "name is required"}),
    description: z.string().optional(),
})

export type TicketCategoryCreate = z.infer<typeof TicketCategoryCreateSchema>
