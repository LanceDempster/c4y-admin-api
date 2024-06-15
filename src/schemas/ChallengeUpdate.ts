import {z} from 'zod'

export const ChallengeUpdateSchema = z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    challengeImage: z.string().optional(),
    challengeUrl: z.string().optional(),
})

export type ChallengeUpdate = z.infer<typeof ChallengeUpdateSchema>
