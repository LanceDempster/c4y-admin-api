import {z} from 'zod'
export const ForgotPasswordSchema = z.object({
    email: z.string({
        required_error: "email is required"
    }).email('Invalid email'),
}) 

export type ForgotPassword = z.infer<typeof ForgotPasswordSchema>