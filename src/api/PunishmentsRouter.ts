import {Router} from "express";
import {authAdmin} from "../middlewares/Auth";
import * as PunishmentsController from "../controllers/PunishmentsController";
import { PunishmentCreateSchema } from "../schemas/PunishmentCreate";
import { bodyValidation } from "../middlewares/Validation";
import { PunishmentUpdateSchema } from "../schemas/PunishmentUpdate";


const PunishmentsRouter = Router();


PunishmentsRouter.get('/', authAdmin, PunishmentsController.getAll);

// productRouter.get('/:id', authAdmin, ProductController.get );

PunishmentsRouter.post('/create', authAdmin, bodyValidation(PunishmentCreateSchema), PunishmentsController.create);

PunishmentsRouter.put('/:id', authAdmin, bodyValidation(PunishmentUpdateSchema), PunishmentsController.update);

PunishmentsRouter.delete('/:id', authAdmin, PunishmentsController.deletePunishment);


export default PunishmentsRouter;
