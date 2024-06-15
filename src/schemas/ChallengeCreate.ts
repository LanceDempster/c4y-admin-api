import {z} from 'zod'

export const ChallengeCreateSchema = z.object({
    name: z.string({required_error: "name is required"}),
    description: z.string({required_error: "description is required"}),
    challengeImage: z.string({required_error: "challenge image is required"}),
    challengeUrl: z.string({required_error: "challenge url is required"}),
})

export type ChallengeCreate = z.infer<typeof ChallengeCreateSchema>
