import {z} from 'zod'

export const BillingStatusSearchSchema = z.object({
    code: z.number().optional(),
    description: z.string().optional(),
    page: z.number().optional()
})

export type BillingStatusSearch = z.infer<typeof BillingStatusSearchSchema>
