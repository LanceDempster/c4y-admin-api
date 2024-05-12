import {Router} from "express";
import {authAdmin} from "../middlewares/Auth";
import * as StoryStatusController from "../controllers/StoryStatusController";
import {bodyValidation} from "../middlewares/Validation";
import {StoryStatusCreateSchema} from "../schemas/StoryStatusCreate";
import {StoryStatusUpdateSchema} from "../schemas/StoryStatusUpdate";


const StoryStatusRouter = Router();


StoryStatusRouter.get('/', authAdmin, StoryStatusController.getAll);

// productRouter.get('/:id', authAdmin, ProductController.get );

StoryStatusRouter.post('/create', authAdmin, bodyValidation(StoryStatusCreateSchema), StoryStatusController.create);

StoryStatusRouter.put('/:id', authAdmin, bodyValidation(StoryStatusUpdateSchema), StoryStatusController.update);

StoryStatusRouter.delete('/:id', authAdmin, StoryStatusController.deleteStoryStatus);


export default StoryStatusRouter;
