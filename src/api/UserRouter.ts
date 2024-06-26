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
import { ChangePasswordSchema } from "../schemas/changePasswordSchema";

const userRouter = Router();

userRouter.post('/login', bodyValidation(LoginSchema), UserController.login );

userRouter.post('/register', bodyValidation(UserResgisterSchema), UserController.register );

userRouter.post('/forgot-password', bodyValidation(ForgotPasswordSchema), UserController.forgotPassword );

userRouter.post('/reset-password', bodyValidation(ResetPasswordSchema), UserController.resetPassword );

userRouter.get('/profile', authUser, UserController.getProfile );

userRouter.get('/', queryValidation(UserSearchSchema), authAdmin, UserController.getAll );

userRouter.get('/products/:id', authAdmin, UserController.getUserProducts);

userRouter.post('/products/create', authAdmin, UserController.createUserProduct);

userRouter.delete('/products/:userid/:productid', authAdmin, UserController.deleteUserProduct);

userRouter.get('/active', authAdmin, UserController.getAllActiveCount);

userRouter.get('/:id', authAdmin, UserController.get );

userRouter.post('/create', authAdmin, bodyValidation(UserResgisterSchema), UserController.create );

userRouter.put('/:id', authAdmin, bodyValidation(UserUpdateSchema), UserController.update );

userRouter.delete('/:id', authAdmin, UserController.deleteUser );

userRouter.post('/activate/:id', authAdmin, UserController.activate );

userRouter.post('/disable/:id', authAdmin, UserController.disable );

userRouter.post('/change-password', authAdmin, bodyValidation(ChangePasswordSchema), UserController.changePassword);

export default userRouter;
