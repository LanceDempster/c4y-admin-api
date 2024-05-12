import {z} from 'zod'

export const RuleSearchSchema = z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    page: z.number().optional()
})

export type RuleSearch = z.infer<typeof RuleSearchSchema>
