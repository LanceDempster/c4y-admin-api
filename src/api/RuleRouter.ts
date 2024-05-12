import {Router} from "express";
import {authAdmin} from "../middlewares/Auth";
import * as RuleController from "../controllers/RuleController";
import {bodyValidation} from "../middlewares/Validation";
import {RuleCreateSchema} from "../schemas/RuleCreate";
import {RuleUpdateSchema} from "../schemas/RuleUpdate";


const RuleRouter = Router();


RuleRouter.get('/', authAdmin, RuleController.getAll);

// productRouter.get('/:id', authAdmin, ProductController.get );

RuleRouter.post('/create', authAdmin, bodyValidation(RuleCreateSchema), RuleController.create);

RuleRouter.put('/:id', authAdmin, bodyValidation(RuleUpdateSchema), RuleController.update);

RuleRouter.delete('/:id', authAdmin, RuleController.deleteRule);


export default RuleRouter;
