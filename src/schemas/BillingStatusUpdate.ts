import {z} from 'zod'

export const BillingStatusUpdateSchema = z.object({
    status: z.string().optional(),
    description: z.string().optional(),
})

export type BillingStatusUpdate = z.infer<typeof BillingStatusUpdateSchema>
