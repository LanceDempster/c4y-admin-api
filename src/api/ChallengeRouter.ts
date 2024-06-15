import {Router} from "express";
import {authAdmin} from "../middlewares/Auth";
import * as ChallengeController from "../controllers/ChallengeController";
import {bodyValidation} from "../middlewares/Validation";
import { ChallengeCreateSchema } from "../schemas/ChallengeCreate";
import { ChallengeUpdateSchema } from "../schemas/ChallengeUpdate";


const ChallengeRouter = Router();


ChallengeRouter.get('/', authAdmin, ChallengeController.getAll);

// productRouter.get('/:id', authAdmin, ProductController.get );

ChallengeRouter.post('/create', authAdmin, bodyValidation(ChallengeCreateSchema), ChallengeController.create);

ChallengeRouter.put('/:id', authAdmin, bodyValidation(ChallengeUpdateSchema), ChallengeController.update);

ChallengeRouter.delete('/:id', authAdmin, ChallengeController.deleteChallenges);


export default ChallengeRouter;
