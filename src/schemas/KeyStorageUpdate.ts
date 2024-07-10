import {z} from 'zod'

export const KeyStorageUpdateSchema = z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    level: z.string().optional(),
})

export type KeyStorageUpdate = z.infer<typeof KeyStorageUpdateSchema>
