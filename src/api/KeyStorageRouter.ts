import { Router } from "express";
import { authAdmin } from "../middlewares/Auth";
import * as KeyStorageController from "../controllers/KeyStorageController";
import { bodyValidation } from "../middlewares/Validation";
import { KeyStorageCreateSchema } from "../schemas/KeyStorageCreate";
import { KeyStorageUpdateSchema } from "../schemas/KeyStorageUpdate";

const KeyStorageRouter = Router();

KeyStorageRouter.get("/", KeyStorageController.getAll);

// productRouter.get('/:id', authAdmin, ProductController.get );

KeyStorageRouter.post(
  "/create",
  authAdmin,
  bodyValidation(KeyStorageCreateSchema),
  KeyStorageController.create,
);

KeyStorageRouter.put(
  "/:id",
  authAdmin,
  bodyValidation(KeyStorageUpdateSchema),
  KeyStorageController.update,
);

KeyStorageRouter.delete(
  "/:id",
  authAdmin,
  KeyStorageController.deleteProduct,
);

export default KeyStorageRouter;
