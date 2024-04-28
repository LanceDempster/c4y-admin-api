import {z} from 'zod'
export const ProductCreateSchema = z.object({
    description: z.string({required_error: "Description name is required"}),
    prodStatus: z.enum(['ALPHA', 'BETA', 'LIVE'], {required_error: 'status is required'}),
    price: z.number({required_error: "price is required"})
})

export type ProductCreate = z.infer<typeof ProductCreateSchema>
