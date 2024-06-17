import {z} from 'zod'

export const RewardSearchSchema = z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    rewardImage: z.string().optional(),
    rewardUrl: z.string().optional(),
    page: z.number().optional()
})

export type RewardSearch = z.infer<typeof RewardSearchSchema>
