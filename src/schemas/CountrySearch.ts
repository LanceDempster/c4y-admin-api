import {z} from 'zod'

export const CountrySearchSchema = z.object({
    name: z.string().optional(),
    code: z.enum(['ALPHA', 'BETA', 'LIVE']).optional(),
    page: z.number().optional()
})

export type CountrySearch = z.infer<typeof CountrySearchSchema>
