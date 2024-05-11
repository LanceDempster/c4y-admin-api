import {Router} from "express";
import {authAdmin} from "../middlewares/Auth";
import * as PauseGameController from "../controllers/PauseGameController";
import {bodyValidation} from "../middlewares/Validation";
import {PauseGameCreateSchema} from "../schemas/PauseGameCreate";
import {PauseGameUpdateSchema} from "../schemas/PauseGameUpdate";


const PauseGameRouter = Router();


PauseGameRouter.get('/', authAdmin, PauseGameController.getAll);

// productRouter.get('/:id', authAdmin, ProductController.get );

PauseGameRouter.post('/create', authAdmin, bodyValidation(PauseGameCreateSchema), PauseGameController.create);

PauseGameRouter.put('/:id', authAdmin, bodyValidation(PauseGameUpdateSchema), PauseGameController.update);

PauseGameRouter.delete('/:id', authAdmin, PauseGameController.deletePauseGame);

export default PauseGameRouter;
