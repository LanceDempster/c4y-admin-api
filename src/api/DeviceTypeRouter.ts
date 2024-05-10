import {Router} from "express";
import {authAdmin} from "../middlewares/Auth";
import * as DeviceTypeController from "../controllers/DeviceTypeController";
import deviceTypeModel from "../models/DeviceTypeModel";
import {bodyValidation} from "../middlewares/Validation";
import {DeviceTypeCreateSchema} from "../schemas/DeviceTypeCreate";
import {DeviceTypeUpdateSchema} from "../schemas/DeviceTypeUpdate";
// import {bodyValidation} from "../middlewares/Validation";
// import {CountryCreateSchema} from "../schemas/CountryCreate";
// import {CountryUpdateSchema} from "../schemas/CountryUpdate";


const DeviceTypeRouter= Router();


DeviceTypeRouter.get('/', authAdmin, DeviceTypeController.getAll);

// productRouter.get('/:id', authAdmin, ProductController.get );

DeviceTypeRouter.post('/create', authAdmin, bodyValidation(DeviceTypeCreateSchema), DeviceTypeController.create);

DeviceTypeRouter.put('/:id', authAdmin, bodyValidation(DeviceTypeUpdateSchema), DeviceTypeController.update);

DeviceTypeRouter.delete('/:id', authAdmin, DeviceTypeController.deleteDeviceType);


export default DeviceTypeRouter;
