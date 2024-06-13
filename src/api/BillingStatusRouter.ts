import {Router} from "express";
import {authAdmin} from "../middlewares/Auth";
import * as BillingStatusController from "../controllers/BillingStatusController";
import {bodyValidation} from "../middlewares/Validation";
import {BillingStatusCreateSchema} from "../schemas/BillingStatusCreate";
import {RuleUpdateSchema} from "../schemas/RuleUpdate";


const BillingStatusRouter = Router();


BillingStatusRouter.get('/', authAdmin, BillingStatusController.getAll);

// productRouter.get('/:id', authAdmin, ProductController.get );

BillingStatusRouter.post('/create', authAdmin, bodyValidation(BillingStatusCreateSchema), BillingStatusController.create);

BillingStatusRouter.put('/:id', authAdmin, bodyValidation(RuleUpdateSchema), BillingStatusController.update);

BillingStatusRouter.delete('/:id', authAdmin, BillingStatusController.deleteBillingStatus);


export default BillingStatusRouter;
