import {z} from 'zod'

export const BillingStatusCreateSchema = z.object({
    status: z.string({required_error: "status is required"}),
    description: z.string(),
})

export type BillingStatusCreate = z.infer<typeof BillingStatusCreateSchema>
