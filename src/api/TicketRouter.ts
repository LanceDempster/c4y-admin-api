import {Router} from "express";
import {authAdmin} from "../middlewares/Auth";
// import * as TicketController from "../controllers/TicketController";
import {bodyValidation} from "../middlewares/Validation";
// import {TicketCreateSchema} from "../schemas/TicketCreate";
// import {TicketUpdateSchema} from "../schemas/TicketUpdate";


const ticketRouter = Router();


ticketRouter.get('/', authAdmin, TicketController.getAll);

// productRouter.get('/:id', authAdmin, ProductController.get );

// ticketRouter.post('/create', authAdmin, bodyValidation(TicketStatusCreateSchema), TicketStatusController.create);

// ticketRouter.put('/:id', authAdmin, bodyValidation(TicketStatusUpdateSchema), TicketStatusController.update);

// ticketRouter.delete('/:id', authAdmin, TicketStatusController.deleteTicketStatus);


export default ticketRouter;
