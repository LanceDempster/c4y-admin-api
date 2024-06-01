import {Router} from "express";
import {authAdmin} from "../middlewares/Auth";
import * as TicketCategoryController from "../controllers/TicketCategoryController";
import {bodyValidation} from "../middlewares/Validation";
import { TicketCategoryCreateSchema } from "../schemas/TicketCategoryCreate";
import { TicketCategoryUpdateSchema } from "../schemas/TicketCategoryUpdate";


const ticketCategoryRouter = Router();


ticketCategoryRouter.get('/', authAdmin, TicketCategoryController.getAll);

// productRouter.get('/:id', authAdmin, ProductController.get );

ticketCategoryRouter.post('/create', authAdmin, bodyValidation(TicketCategoryCreateSchema), TicketCategoryController.create);

ticketCategoryRouter.put('/:id', authAdmin, bodyValidation(TicketCategoryUpdateSchema), TicketCategoryController.update);

ticketCategoryRouter.delete('/:id', authAdmin, TicketCategoryController.deleteTicketCategory);


export default ticketCategoryRouter;
