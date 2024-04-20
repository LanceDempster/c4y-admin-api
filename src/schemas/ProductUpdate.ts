import {z} from 'zod'
export const ProductUpdateSchema = z.object({
    description: z.string().optional(),
    prodStatus: z.enum(['ALPHA', 'BETA', 'LIVE']).optional()
}) 

export type ProductUpdate = z.infer<typeof ProductUpdateSchema>