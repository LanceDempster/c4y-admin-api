import {Router} from "express";
import {authAdmin} from "../middlewares/Auth";
import * as GameStatusController from "../controllers/GameStatusController";
import {bodyValidation} from "../middlewares/Validation";
import {GameStatusCreateSchema} from "../schemas/GameStatusCreate";
import {GameStatusUpdateSchema} from "../schemas/GameStatusUpdate";


const gameStatusRouter = Router();


gameStatusRouter.get('/', authAdmin, GameStatusController.getAll);

// productRouter.get('/:id', authAdmin, ProductController.get );

gameStatusRouter.post('/create', authAdmin, bodyValidation(GameStatusCreateSchema), GameStatusController.create);

gameStatusRouter.put('/:id', authAdmin, bodyValidation(GameStatusUpdateSchema), GameStatusController.update);

gameStatusRouter.delete('/:id', authAdmin, GameStatusController.deleteGameStatus);


export default gameStatusRouter;
