import {z} from 'zod'

export const ChallengeSearchSchema = z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    challengeImage: z.string().optional(),
    challengeUrl: z.string().optional(),
    page: z.number().optional()
})

export type ChallengeSearch = z.infer<typeof ChallengeSearchSchema>
