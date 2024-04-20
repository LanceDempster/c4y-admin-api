import {z} from 'zod'
export const ResetPasswordSchema = z.object({
    resetPasswordToken: z.string({
        required_error: "token is required"
    }),
    newPassword: z.string({
        required_error: 'password is required'
    }).min(8)
}) 

export type ResetPassword = z.infer<typeof ResetPasswordSchema> 