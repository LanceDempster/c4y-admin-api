import {z} from 'zod'

export const KeyStorageCreateSchema = z.object({
    name: z.string({required_error: "name is required"}),
    description: z.string({required_error: "description is required"}),
		level: z.string()
})

export type KeyStorageCreate = z.infer<typeof KeyStorageCreateSchema>
