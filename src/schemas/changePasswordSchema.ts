import {z} from 'zod'

export const ChangePasswordSchema = z.object({
    password: z.string(),
		userId: z.number()
}) 

export type ChangePassword = z.infer<typeof ChangePasswordSchema>
