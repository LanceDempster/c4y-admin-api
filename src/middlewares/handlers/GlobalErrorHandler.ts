import { NextFunction, Request, Response } from "express";
import { Result } from "../../dto/Result";
import NotAuthorized from "../../errors/NotAuthorized";
import { DatabaseError } from "pg";
import BadRequest from "../../errors/BadRequest";

export const globalErrorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {


    if (err instanceof BadRequest) {
        return res.status(400).send(new Result(
            false,
            '',
            {
                handler: 'GLOBAL_ERROR_HANDLER',
                ...err,
                message: err.message
            }
        ))
    }

    if (err instanceof NotAuthorized) {
        return res.status(401).send(new Result(
            false,
            '',
            {
                handler: 'GLOBAL_ERROR_HANDLER',
                ...err,
                message: err.message
            }
        ))
    }

    if (err instanceof DatabaseError) {
        return res.status(500).send(new Result(
            false,
            '',
            {
                handler: 'GLOBAL_ERROR_HANDLER',
                name: 'DataBaseError',
                message: err.message
            }))
    }


    res.status(500).send(new Result(
        false,
        '',
        {
            handler: 'GLOBAL_ERROR_HANDLER',
            name: err.name,
            message: err.message || 'Something failed!',
        }
    )
    )

}