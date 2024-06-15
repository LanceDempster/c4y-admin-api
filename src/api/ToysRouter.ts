import {Router} from "express";
import {authAdmin} from "../middlewares/Auth";
import * as ToysController from "../controllers/ToysController";
import {bodyValidation} from "../middlewares/Validation";
import { ChallengeCreateSchema } from "../schemas/ChallengeCreate";
import { ChallengeUpdateSchema } from "../schemas/ChallengeUpdate";
import { ToyCreateSchema } from "../schemas/ToyCreate";


const ToysRouter = Router();


ToysRouter.get('/', authAdmin, ToysController.getAll);

// productRouter.get('/:id', authAdmin, ProductController.get );

ToysRouter.post('/create', authAdmin, bodyValidation(ToyCreateSchema), ToysController.create);

ToysRouter.put('/:id', authAdmin, bodyValidation(ChallengeUpdateSchema), ToysController.update);

ToysRouter.delete('/:id', authAdmin, ToysController.deleteToys);


export default ToysRouter;
