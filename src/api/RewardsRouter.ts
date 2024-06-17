import {Router} from "express";
import {authAdmin} from "../middlewares/Auth";
import * as rewardsController from "../controllers/RewardsController";
import {bodyValidation} from "../middlewares/Validation";
import { RewardCreateSchema } from "../schemas/RewardCreate";
import { RewardUpdateSchema } from "../schemas/RewardUpdate";


const RewardsRouter = Router();


RewardsRouter.get('/', authAdmin, rewardsController.getAll);

// productRouter.get('/:id', authAdmin, ProductController.get );

RewardsRouter.post('/create', authAdmin, bodyValidation(RewardCreateSchema), rewardsController.create);

RewardsRouter.put('/:id', authAdmin, bodyValidation(RewardUpdateSchema), rewardsController.update);

RewardsRouter.delete('/:id', authAdmin, rewardsController.deleteRewards);


export default RewardsRouter;
