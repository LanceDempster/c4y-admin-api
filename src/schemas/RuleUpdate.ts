import {z} from 'zod'

export const RuleUpdateSchema = z.object({
    name: z.string().optional(),
    description: z.string().optional(),
})

export type RuleUpdate = z.infer<typeof RuleUpdateSchema>
