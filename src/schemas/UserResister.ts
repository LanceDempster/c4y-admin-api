import { z } from "zod";

export const UserRegisterSchema = z.object({
  firstName: z.string({ required_error: "First name is required" }),
  lastName: z.string({ required_error: "Last name is required" }),
  username: z.string({ required_error: "Username is required" }),
  email: z
    .string({ required_error: "email is required" })
    .email("Not a valid email"),
  password: z
    .string({ required_error: "password is required" })
    .min(8, "password must be more than 8 characters"),
  country: z.string({ required_error: "country is required" }),
  dateOfBirth: z.coerce.date({ required_error: "date of birth is required" }),
  gender: z.enum(["MALE", "FEMALE"], { required_error: "gender is required" }),
  timezone: z.string({ required_error: "Time Zone Required" }),
  productCode: z.string({ required_error: "Product Code required" }),
});

export type UserResister = z.infer<typeof UserRegisterSchema>;
