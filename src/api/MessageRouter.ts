import {Router} from "express";
import {authAdmin} from "../middlewares/Auth";
import * as MessageController from "../controllers/MessageController";
import {bodyValidation} from "../middlewares/Validation";
import {MessageCreateSchema} from "../schemas/MessageCreate";
import {MessageUpdateSchema} from "../schemas/MessageUpdate";



const MessageRouter = Router();


MessageRouter.get('/', authAdmin, MessageController.getAll);

// productRouter.get('/:id', authAdmin, ProductController.get );

MessageRouter.post('/create', authAdmin, bodyValidation(MessageCreateSchema), MessageController.create);

MessageRouter.put('/:id', authAdmin, bodyValidation(MessageUpdateSchema), MessageController.update);

MessageRouter.delete('/:id', authAdmin, MessageController.deleteMessage);


export default MessageRouter;
