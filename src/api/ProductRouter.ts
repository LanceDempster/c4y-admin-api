import { Router } from "express";
import { bodyValidation, queryValidation } from "../middlewares/Validation";
import { authAdmin } from "../middlewares/Auth";
import { ProductSearchSchema } from "../schemas/ProductSearch";
import * as ProductController from "../controllers/ProductController";
import { ProductCreateSchema } from "../schemas/ProductCreate";
import { ProductUpdateSchema } from "../schemas/ProductUpdate";

const productRouter = Router();


productRouter.get('/', queryValidation(ProductSearchSchema), authAdmin, ProductController.getAll );

productRouter.get('/:id', authAdmin, ProductController.get );

productRouter.post('/create', bodyValidation(ProductCreateSchema), ProductController.create );

productRouter.put('/:id', bodyValidation(ProductUpdateSchema), ProductController.update );

productRouter.delete('/:id', authAdmin, ProductController.deleteProduct );


export default productRouter;