import {Router} from "express";
import {authAdmin} from "../middlewares/Auth";
import * as HealthCheckinController from "../controllers/HealthCheckinController";
import {bodyValidation} from "../middlewares/Validation";
import {HealthCheckinCreateSchema} from "../schemas/HealthCheckinCreate";
import {HealthCheckingUpdateSchema} from "../schemas/HealthCheckinUpdate";


const HealthCheckinRouter = Router();


HealthCheckinRouter.get('/', authAdmin, HealthCheckinController.getAll);

// productRouter.get('/:id', authAdmin, ProductController.get );

HealthCheckinRouter.post('/create', authAdmin, bodyValidation(HealthCheckinCreateSchema), HealthCheckinController.create);

HealthCheckinRouter.put('/:id', authAdmin, bodyValidation(HealthCheckingUpdateSchema), HealthCheckinController.update);

HealthCheckinRouter.delete('/:id', authAdmin, HealthCheckinController.deleteHealthCheckin);


export default HealthCheckinRouter;
