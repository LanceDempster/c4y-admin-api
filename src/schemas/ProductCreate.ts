import { z } from "zod";
export const ProductCreateSchema = z.object({
  product_code: z.number({ required_error: "Product code is required" }),
  product_name: z.string({ required_error: "Product name is required" }),
  description: z.string({ required_error: "Description is required" }),
  prodStatus: z.enum(["ALPHA", "BETA", "LIVE"], {
    required_error: "status is required",
  }),
  price: z.number({ required_error: "price is required" }),
});

export type ProductCreate = z.infer<typeof ProductCreateSchema>;
