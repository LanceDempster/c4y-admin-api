import {z} from 'zod'

export const RuleCreateSchema = z.object({
    name: z.string({required_error: "name is required"}),
    description: z.string().optional(),
})

export type RuleCreate = z.infer<typeof RuleCreateSchema>
