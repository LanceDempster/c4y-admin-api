import {z} from 'zod'
export const UserResgisterSchema = z.object({
    firstName: z.string({required_error: "First name is required"}),
    lastName : z.string({required_error: "Last name is required"}),
    email: z.string({required_error: 'email is required'}).email('Not a valid email'),
    password: z.string({required_error: 'password is required'}).min(8, 'password must be more than 8 characters'),
    country: z.string({required_error: 'counrty is required'}),
    dateOfBirth: z.coerce.date({required_error: 'date of birth is required'}),
    gender: z.enum(['MALE', 'FEMALE'], {required_error: 'gender is required'})
}) 

export type UserResgister = z.infer<typeof UserResgisterSchema>