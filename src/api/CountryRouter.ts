import {Router} from "express";
import {authAdmin} from "../middlewares/Auth";
import * as CountryController from "../controllers/CountryController";
import {bodyValidation} from "../middlewares/Validation";
import {CountryCreateSchema} from "../schemas/CountryCreate";
import {CountryUpdateSchema} from "../schemas/CountryUpdate";


const CountryRouter = Router();


CountryRouter.get('/', authAdmin, CountryController.getAll);

// productRouter.get('/:id', authAdmin, ProductController.get );

CountryRouter.post('/create', authAdmin, bodyValidation(CountryCreateSchema), CountryController.create);

CountryRouter.put('/:id', authAdmin, bodyValidation(CountryUpdateSchema), CountryController.update);

CountryRouter.delete('/:id', authAdmin, CountryController.deleteCountry);


export default CountryRouter;
