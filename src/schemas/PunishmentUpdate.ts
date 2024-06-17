import {z} from 'zod'

export const PunishmentUpdateSchema = z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    punishmentImage: z.string().optional(),
    punishmentUrl: z.string().optional(),
    level: z.string().optional(),
})

export type PunishmentUpdate = z.infer<typeof PunishmentUpdateSchema>
