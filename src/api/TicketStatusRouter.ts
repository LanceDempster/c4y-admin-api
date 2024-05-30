import {Router} from "express";
import {authAdmin} from "../middlewares/Auth";
import * as TicketStatusController from "../controllers/TicketStatusController";
import {bodyValidation} from "../middlewares/Validation";
import {TicketStatusCreateSchema} from "../schemas/TicketStatusCreate";
import {TicketStatusUpdateSchema} from "../schemas/TicketStatusUpdate";


const ticketStatusRouter = Router();


ticketStatusRouter.get('/', authAdmin, TicketStatusController.getAll);

// productRouter.get('/:id', authAdmin, ProductController.get );

ticketStatusRouter.post('/create', authAdmin, bodyValidation(TicketStatusCreateSchema), TicketStatusController.create);

ticketStatusRouter.put('/:id', authAdmin, bodyValidation(TicketStatusUpdateSchema), TicketStatusController.update);

ticketStatusRouter.delete('/:id', authAdmin, TicketStatusController.deleteTicketStatus);


export default ticketStatusRouter;
