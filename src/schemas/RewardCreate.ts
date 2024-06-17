import {z} from 'zod'

export const RewardCreateSchema = z.object({
    name: z.string({required_error: "name is required"}),
    description: z.string({required_error: "description is required"}),
    rewardImage: z.string({required_error: "reward image is required"}),
    rewardUrl: z.string({required_error: "reward url is required"}),
})

export type RewardCreate = z.infer<typeof RewardCreateSchema>
