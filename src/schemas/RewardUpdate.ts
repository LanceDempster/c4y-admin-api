import {z} from 'zod'

export const RewardUpdateSchema = z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    rewardImage: z.string().optional(),
    rewardUrl: z.string().optional(),
})

export type RewardUpdate = z.infer<typeof RewardUpdateSchema>
