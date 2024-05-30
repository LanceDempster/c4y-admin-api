import {z} from 'zod'

export const TicketPriorityCreateSchema = z.object({
    code: z.string({required_error: "Code is required"}),
    name: z.string({required_error: "Name is required"}),
    description: z.string().optional(),
})

export type TicketPriorityCreate = z.infer<typeof TicketPriorityCreateSchema>
