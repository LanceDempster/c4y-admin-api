import {z} from 'zod'

export const PunishmentSearchSchema = z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    punishmentImage: z.string().optional(),
    punishmentUrl: z.string().optional(),
		level: z.string().optional(),
    page: z.number().optional()
})

export type PunishmentSearch = z.infer<typeof PunishmentSearchSchema>
