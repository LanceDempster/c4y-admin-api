import {Router} from "express";
import {authAdmin} from "../middlewares/Auth";
import * as TicketPriorityController from "../controllers/TicketPriorityController";
import {bodyValidation} from "../middlewares/Validation";
import { TicketPriorityCreateSchema } from "../schemas/TicketPriorityCreate";
import { TicketPriorityUpdateSchema } from "../schemas/TicketPriorityUpdate";


const ticketPriorityRouter = Router();


ticketPriorityRouter.get('/', authAdmin, TicketPriorityController.getAll);

// productRouter.get('/:id', authAdmin, ProductController.get );

ticketPriorityRouter.post('/create', authAdmin, bodyValidation(TicketPriorityCreateSchema), TicketPriorityController.create);

ticketPriorityRouter.put('/:id', authAdmin, bodyValidation(TicketPriorityUpdateSchema), TicketPriorityController.update);

ticketPriorityRouter.delete('/:id', authAdmin, TicketPriorityController.deleteTicketPriority);


export default ticketPriorityRouter;
