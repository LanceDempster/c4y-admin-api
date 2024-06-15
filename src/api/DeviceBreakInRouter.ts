import {Router} from "express";
import {authAdmin} from "../middlewares/Auth";
import * as DeviceBreakInController from "../controllers/DeviceBreakInController";
import {bodyValidation} from "../middlewares/Validation";
import { DeviceBreakInCreateSchema } from "../schemas/DeviceBreakInCreate";
import { DeviceBreakInUpdateSchema } from "../schemas/DeviceBreakInUpdate";


const DeviceBreakInRouter = Router();


DeviceBreakInRouter.get('/', authAdmin, DeviceBreakInController.getAll);

// productRouter.get('/:id', authAdmin, ProductController.get );

DeviceBreakInRouter.post('/create', authAdmin, bodyValidation(DeviceBreakInCreateSchema), DeviceBreakInController.create);

DeviceBreakInRouter.put('/:id', authAdmin, bodyValidation(DeviceBreakInUpdateSchema), DeviceBreakInController.update);

DeviceBreakInRouter.delete('/:id', authAdmin, DeviceBreakInController.deleteDeviceBreakIn);


export default DeviceBreakInRouter;
