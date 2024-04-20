import {z} from 'zod'
export const LoginSchema = z.object({
    email: z.string({
        required_error: "email is required"
    }).email('Invalid email'),
    password: z.string({
        required_error: "Password is required"
    }),
}) 

export type LoginType = z.infer<typeof LoginSchema>