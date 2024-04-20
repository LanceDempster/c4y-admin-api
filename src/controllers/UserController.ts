import { RequestHandler } from "express";
import { LoginType } from "../schemas/Login";
import { UserResgister } from "../schemas/UserResgister";
import UserModel from "../models/UserModel"
import { compare, hash } from "bcrypt";
import { User } from "../interfaces/User";
import { sign, decode } from "jsonwebtoken";
import NotFound from "../errors/NotFound";
import NotAuthorized from "../errors/NotAuthorized";
import { ForgotPassword } from "../schemas/ForgotPassword";
import BadRequest from "../errors/BadRequest";
import { Result } from "../dto/Result";
import { ResetPassword } from "../schemas/ResetPassword";
import { UserSearch } from "../schemas/UserSearch";
import { AccountStatus } from "../enum/AccountStatus";
import { sendMail } from "../utils/email";
import { Token } from "../types/Token";

export const login: RequestHandler = async (req, res, next) => {

    try {
        const { email, password }: LoginType = req.body;

        const user = await UserModel.getByEmail(email);

        if (!user) return next(new NotFound('There is no user with this email'));

        const checkPass = await compare(password, user.password);

        if (!checkPass) return next(new NotAuthorized('Invalid password'));

        const token = sign({
            id: user.id,
            createdAt: new Date(),
            role: 'USER'
        } as Token, process.env.SECRET as string);

        return res.status(200).send(new Result(
            true,
            '',
            {
                id: user.id,
                fullName: user.firstName + ' ' + user.lastName,
                email: user.email,
                gender: user.gender,
                dateOfBirth: user.dateOfBirth,
                token,
            }
        ));
    }

    catch (e) {
        next(e)
    }

}

export const register: RequestHandler = async (req, res, next) => {

    try {

        const userData = req.body as UserResgister;

        const passwordHash = await hash(userData.password, 10);

        const user = {
            id: 0,
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
            country: userData.country,
            dateOfBirth: userData.dateOfBirth,
            gender: userData.gender,
            emailValidation: false,
            accountStatus: "ACTIVE",
            password: passwordHash,
            accountCreateDate: new Date(),
            passwordCreateDate: new Date()
        }

        const result = await UserModel.create(user as User)

        const token = sign({
            id: result.id,
            createdAt: new Date(),
            role: "USER"
        } as Token, process.env.SECRET as string)

        return res.status(200).send(new Result(
            true,
            '',
            {
                id: result.id,
                fullName: result.firstName + ' ' + result.lastName,
                email: result.email,
                gender: result.gender,
                dateOfBirth: result.dateOfBirth,
                token,
            }
        ));
    }

    catch (e) {
        next(e);
    }

}

export const create: RequestHandler = async (req, res, next) => {

    try {

        const userData = req.body as UserResgister;

        const passwordHash = await hash(userData.password, 10);

        const user = {
            id: 0,
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
            country: userData.country,
            dateOfBirth: userData.dateOfBirth,
            gender: userData.gender,
            emailValidation: false,
            accountStatus: "ACTIVE",
            password: passwordHash,
            accountCreateDate: new Date(),
            passwordCreateDate: new Date()
        }

        const result = await UserModel.create(user as User)

        return res.status(200).send(new Result(
            true,
            'User created',
            {
                id: result.id
            }
        ));
    }

    catch (e) {
        next(e);
    }

}

export const forgotPassword: RequestHandler = async (req, res, next) => {

    try {

        const { email }: ForgotPassword = req.body;

        const user = await UserModel.getByEmail(email);

        if (!user) return next(new BadRequest('There is no user with this email'));

        const resetPasswordToken = Math.random().toString(36).substring(2, 20);

        const newUser = await UserModel.updateById(user.id, { resetPasswordToken });

        //Send Email with token
        await sendMail('zizo.zoom.z0@gmail.com', newUser.email, 'Reset Password', resetPasswordToken);

        return res.status(200).send(new Result(
            true,
            'Check your email to change your password'
        ))
    }

    catch (e) {
        next(e)
    }
}

export const resetPassword: RequestHandler = async (req, res, next) => {
    try {
        const { resetPasswordToken, newPassword }: ResetPassword = req.body;

        const user = await UserModel.getOne({ resetPasswordToken });

        if (!user) return next(new NotFound('User not found or invalid token'));

        const newPasswordHash = await hash(newPassword, 10);

        await UserModel.updateById(user.id, { password: newPasswordHash, resetPasswordToken: '', passwordCreateDate: new Date() });

        res.status(200).send(new Result(
            true,
            'Your password have been changed succesffully!'
        ))
    }
    catch (e) {
        next(e)
    }
}

export const getAll: RequestHandler = async (req, res, next) => {

    try {
        let query = {};
        Object.assign(query, req.query);
        const { firstName, lastName, email, page }: UserSearch = query;

        let [users, count] = await UserModel.search({ firstName, lastName, email }, page);

        // if(count === -1) count = await UserModel.count();

        res.status(200).send(new Result(
            true,
            count+'',
            users.map((x: User) => {
                return {
                    ...x,
                    passwordCreateDate: x.passwordCreateDate.toLocaleString(),
                    accountCreateDate: x.accountCreateDate.toLocaleString(),
                    dateOfBirth: x.dateOfBirth.toLocaleDateString()
                }
            })
        ))

    }

    catch (e) {
        next(e);
    }

}

export const deleteUser: RequestHandler<{ id: string }> = async (req, res, next) => {
    try {

        const { id } = req.params;

        const user = await UserModel.getById(~~(+id));

        if (!user) return next(new NotFound('No user with this ID'));

        await UserModel.deleteById(user.id);

        return res.status(200).send(new Result(
            true,
            `User with Id:${id} deleted`
        ));
    }
    catch (e) {
        next(e);
    }
}

export const get: RequestHandler<{ id: string }> = async (req, res, next) => {
    try {

        const { id } = req.params;

        const user = await UserModel.getById(~~(+id));

        if (!user) return next(new NotFound('No user with this ID'));

        return res.status(200).send(new Result(
            true,
            '',
            user
        ));

    }
    catch (e) {
        next(e);
    }
}

export const update: RequestHandler<{ id: string }> = async (req, res, next) => {
    try {

        const { id } = req.params;

        const user = await UserModel.getById(~~(+id));

        if (!user) return next(new NotFound('No user with this ID'));

        const newUser = await UserModel.updateById(~~(+id), req.body);

        return res.status(200).send(new Result(
            true,
            "User updated successfully",
            newUser
        ))

    }
    catch (e) {
        next(e);
    }
}

export const activate: RequestHandler<{ id: string }> = async (req, res, next) => {
    try {

        const { id } = req.params;

        const user = await UserModel.getById(~~(+id));

        if (!user) return next(new NotFound('No user with this ID'));

        const newUser = await UserModel.updateById(~~(+id), { accountStatus: AccountStatus.ACTIVE });

        return res.status(200).send(new Result(
            true,
            "User disabled successfully",
            newUser
        ))

    }
    catch (e) {
        next(e);
    }
}

export const disable: RequestHandler<{ id: string }> = async (req, res, next) => {
    try {

        const { id } = req.params;

        const user = await UserModel.getById(~~(+id));

        if (!user) return next(new NotFound('No user with this ID'));

        const newUser = await UserModel.updateById(~~(+id), { accountStatus: AccountStatus.DISABLED });

        return res.status(200).send(new Result(
            true,
            "User disabled successfully",
            newUser
        ))

    }
    catch (e) {
        next(e);
    }
}

export const getProfile: RequestHandler<{ id: string }> = async (req, res, next) => {

    try {

        return res.status(200).send(new Result(
            true,
            "",
            req.body.user
        ))

    }

    catch (e) {
        next(e)
    }

}