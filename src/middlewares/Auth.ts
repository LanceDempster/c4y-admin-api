import { NextFunction, Request, Response } from "express";
import NotAuthorized from "../errors/NotAuthorized";
import UserModel from "../models/UserModel";
import { verify } from "jsonwebtoken";
import { Token } from "../types/Token";
import AdminModel from "../models/AdminModel";

export const authUser = async (req: Request, res: Response, next: NextFunction) => {

    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return next(new NotAuthorized('Unauthorized'));
        }

        try {
            const decoded: Token = verify(token, process.env.SECRET as string) as any;
            const user = await UserModel.getById(decoded.id);
            console.log(user, decoded);
            if (!user) {
                return next(new NotAuthorized('Invalid token'));
            }
            req.body.user = user;
            req.body.token = decoded;
            return next();
        }
        catch (e) {
            return next(new NotAuthorized('Unauthorized'));
        }


    } catch (e) {
        return next(e);
    }

}

export const authAdmin = async (req: Request, res: Response, next: NextFunction) => {

    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return next(new NotAuthorized('Unauthorized'));
        }

        try {
            const decoded: Token = verify(token, process.env.SECRET as string) as any;
            const user = await AdminModel.getById(decoded.id);
            if (!user) {
                return next(new NotAuthorized('Invalid token'));
            }
            req.body.user = user;
            req.body.token = decoded;
            return next();
        }
        catch (e) {
            return next(new NotAuthorized('Unauthorized'));
        }


    } catch (e) {
        return next(e);
    }

}