import {z} from 'zod'

export const CountryCreateSchema = z.object({
    name: z.string({required_error: "name is required"}),
    code: z.string({required_error: "country code is required"}),
})

export type CountryCreate = z.infer<typeof CountryCreateSchema>
