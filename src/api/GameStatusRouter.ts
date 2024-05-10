import {Router} from "express";
import {authAdmin} from "../middlewares/Auth";
import * as GameStatusController from "../controllers/GameStatusController";
import {bodyValidation} from "../middlewares/Validation";
import {GameStatusCreateSchema} from "../schemas/GameStatusCreate";
import {GameStatusUpdateSchema} from "../schemas/GameStatusUpdate";


const DeviceTypeRouter = Router();


DeviceTypeRouter.get('/', authAdmin, GameStatusController.getAll);

// productRouter.get('/:id', authAdmin, ProductController.get );

DeviceTypeRouter.post('/create', authAdmin, bodyValidation(GameStatusCreateSchema), GameStatusController.create);

DeviceTypeRouter.put('/:id', authAdmin, bodyValidation(GameStatusUpdateSchema), GameStatusController.update);

DeviceTypeRouter.delete('/:id', authAdmin, GameStatusController.deleteGameStatus);


export default DeviceTypeRouter;
