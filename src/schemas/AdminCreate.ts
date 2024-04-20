import {z} from 'zod'
export const AdminCreateSchema = z.object({
    firstName: z.string({required_error: "First name is required"}),
    lastName : z.string({required_error: "Last name is required"}),
    email: z.string({required_error: 'email is required'}).email('Not a valid email'),
    password: z.string({required_error: 'password is required'}).min(8, 'password must be more than 8 characters')
}) 

export type AdminCreate = z.infer<typeof AdminCreateSchema>