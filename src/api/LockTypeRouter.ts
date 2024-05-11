import {Router} from "express";
import {authAdmin} from "../middlewares/Auth";
import * as LockTypeController from "../controllers/LockTypeController";
import {bodyValidation} from "../middlewares/Validation";
import {LockTypeCreateSchema} from "../schemas/LockTypeCreate";
import {LockTypeUpdateSchema} from "../schemas/LockTypeUpdate";


const LockTypeRouter = Router();


LockTypeRouter.get('/', authAdmin, LockTypeController.getAll);

// productRouter.get('/:id', authAdmin, ProductController.get );

LockTypeRouter.post('/create', authAdmin, bodyValidation(LockTypeCreateSchema), LockTypeController.create);

LockTypeRouter.put('/:id', authAdmin, bodyValidation(LockTypeUpdateSchema), LockTypeController.update);

LockTypeRouter.delete('/:id', authAdmin, LockTypeController.deleteLockType);


export default LockTypeRouter;
