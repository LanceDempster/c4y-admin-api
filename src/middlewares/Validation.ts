import { NextFunction, Request, Response } from "express";
import { AnyZodObject, ZodError } from "zod";
import BadRequest from "../errors/BadRequest";

export const bodyValidation = (schema: AnyZodObject) => {

    return async (req: Request, res: Response, next: NextFunction) => {

        try {
            await schema.parseAsync(req.body);
            return next();
        }
        catch(error) {
            if(error instanceof ZodError) {
                return next(new BadRequest('Invalid payload', error.issues.map(x => x.message)));
            }
            throw next(new BadRequest(JSON.stringify(error)));
        }
        
    }

} 

export const queryValidation = (schema: AnyZodObject) => {
    return async (req: Request, res: Response, next: NextFunction) => {

        try {
            await schema.parseAsync({query: req.query});
            return next();
        }
        catch(error) {
            if(error instanceof ZodError) {
                return next(new BadRequest('Invalid payload', error.issues.map(x => x.message)));
            }
            throw next(new BadRequest(JSON.stringify(error)));
        }
    }
}

export const paramValidation = (schema: AnyZodObject) => {

    return async (req: Request, res: Response, next: NextFunction) => {

        try {
            await schema.safeParseAsync(req.params);
            return next();
        }
        catch(error) {
            if(error instanceof ZodError) {
                return next(new BadRequest('Invalid payload', error.issues.map(x => x.message)));
            }
            throw next(new BadRequest(JSON.stringify(error)));
        }
        
    }

} 