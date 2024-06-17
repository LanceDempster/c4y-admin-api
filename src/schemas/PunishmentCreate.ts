import {z} from 'zod'

export const PunishmentCreateSchema = z.object({
    name: z.string({required_error: "name is required"}),
    description: z.string({required_error: "description is required"}),
    punishmentImage: z.string({required_error: "punishment image is required"}),
    punishmentUrl: z.string({required_error: "punishment url is required"}),
		level: z.string()
})

export type PunishmentCreate = z.infer<typeof PunishmentCreateSchema>
