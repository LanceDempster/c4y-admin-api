import { Router } from "express";
import { bodyValidation, paramValidation, queryValidation } from "../middlewares/Validation";
import { LoginSchema } from "../schemas/Login";
import * as AdminController from "../controllers/AdminController";
import { UserRegisterSchema } from "../schemas/UserResister";
import { ForgotPasswordSchema } from "../schemas/ForgotPassword";
import { ResetPasswordSchema } from "../schemas/ResetPassword";
import { AdminCreateSchema } from "../schemas/AdminCreate";
import { authAdmin } from "../middlewares/Auth";
import { AdminSearchSchema } from "../schemas/AdminSearch";
import { AdminUpdateSchema } from "../schemas/AdminUpdate";

const adminRouter = Router();

adminRouter.post('/login', bodyValidation(LoginSchema), AdminController.login );

adminRouter.get('/', authAdmin, queryValidation(AdminSearchSchema), AdminController.getAll );

adminRouter.get('/:id', authAdmin, AdminController.get );

adminRouter.post('/create', authAdmin, bodyValidation(AdminCreateSchema), AdminController.create );

adminRouter.put('/:id', authAdmin, bodyValidation(AdminUpdateSchema), AdminController.update );

adminRouter.delete('/:id', authAdmin, AdminController.deleteAdmin );

adminRouter.post('/activate/:id', authAdmin, AdminController.activate );

adminRouter.post('/disable/:id', authAdmin, AdminController.disable );

adminRouter.post('/forgot-password', bodyValidation(ForgotPasswordSchema), AdminController.forgotPassword );

adminRouter.post('/reset-password', bodyValidation(ResetPasswordSchema), AdminController.resetPassword );

export default adminRouter;
