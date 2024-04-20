import {z} from 'zod'
export const ProductSearchSchema = z.object({
    description: z.string().optional(),
    prodStatus: z.enum(['ALPHA', 'BETA', 'LIVE']).optional(),
    page: z.number().optional()
}) 

export type ProductSearch = z.infer<typeof ProductSearchSchema>