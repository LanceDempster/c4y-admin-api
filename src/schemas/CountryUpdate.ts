import {z} from 'zod'

export const CountryUpdateSchema = z.object({
    name: z.string().optional(),
    code: z.string().optional(),
})

export type CountryUpdate = z.infer<typeof CountryUpdateSchema>
