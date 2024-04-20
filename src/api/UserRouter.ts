import { Router } from "express";
import { bodyValidation, queryValidation } from "../middlewares/Validation";
import { LoginSchema } from "../schemas/Login";
import * as UserController from "../controllers/UserController";
import { UserResgisterSchema } from "../schemas/UserResgister";
import { ForgotPasswordSchema } from "../schemas/ForgotPassword";
import { ResetPasswordSchema } from "../schemas/ResetPassword";
import { UserSearchSchema } from "../schemas/UserSearch";
import { authAdmin, authUser } from "../middlewares/Auth";
import { UserUpdateSchema } from "../schemas/UserUpdate";

const userRouter = Router();

userRouter.post('/login', bodyValidation(LoginSchema), UserController.login );

userRouter.post('/register', bodyValidation(UserResgisterSchema), UserController.register );

userRouter.post('/forgot-password', bodyValidation(ForgotPasswordSchema), UserController.forgotPassword );

userRouter.post('/reset-password', bodyValidation(ResetPasswordSchema), UserController.resetPassword );

userRouter.get('/profile', authUser, UserController.getProfile );

userRouter.get('/', queryValidation(UserSearchSchema), authAdmin, UserController.getAll );

userRouter.get('/:id', authAdmin, UserController.get );

userRouter.post('/create', bodyValidation(UserResgisterSchema), UserController.create );

userRouter.put('/:id', bodyValidation(UserUpdateSchema), UserController.update );

userRouter.delete('/:id', authAdmin, UserController.deleteUser );

userRouter.post('/activate/:id', authAdmin, UserController.activate );

userRouter.post('/disable/:id', authAdmin, UserController.disable );

export default userRouter;