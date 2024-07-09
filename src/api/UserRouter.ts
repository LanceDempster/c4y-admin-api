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

userRouter.get('/settings', authUser, UserController.getUserSettings)

userRouter.get('/profile', authUser, UserController.getProfile );

userRouter.get('/', queryValidation(UserSearchSchema), authAdmin, UserController.getAll );

userRouter.get('/products', authUser, UserController.getMyProducts);

userRouter.get('/products/:id', authAdmin, UserController.getUserProducts);

userRouter.post('/products/create', authAdmin, UserController.createUserProduct);

userRouter.delete('/products/:userid/:productid', authAdmin, UserController.deleteUserProduct);

userRouter.get('/active', authAdmin, UserController.getAllActiveCount);

userRouter.get('/:id', authAdmin, UserController.get );

userRouter.post('/create', authAdmin, bodyValidation(UserResgisterSchema), UserController.create );

userRouter.post('/activate/:id', authAdmin, UserController.activate );

userRouter.post('/disable/:id', authAdmin, UserController.disable );

userRouter.post('/change-password', authAdmin, bodyValidation(ChangePasswordSchema), UserController.changePassword);

userRouter.put('/:id', authAdmin, bodyValidation(UserUpdateSchema), UserController.update );

userRouter.delete('/:id', authAdmin, UserController.deleteUser );



// user settings form steps
userRouter.post("/userSettings/1", authUser, UserController.userSettings1)

userRouter.post("/userSettings/2", authUser, UserController.userSettings2)

userRouter.post("/userSettings/3", authUser, UserController.userSettings2)

userRouter.post("/userSettings/4", authUser, UserController.userSettings4)

userRouter.post("/userSettings/5", authUser, UserController.userSettings5)

userRouter.post("/userSettings/6", authUser, UserController.userSettings6)

userRouter.post("/userSettings/7", authUser, UserController.userSettings7)

userRouter.post("/userSettings/8", authUser, UserController.userSettings8)

export default userRouter;
