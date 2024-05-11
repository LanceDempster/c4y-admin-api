import {RequestHandler} from "express";
import {Result} from "../dto/Result";
import LockTypeModel from "../models/LockTypeModel";
import {LockType} from "../interfaces/LockType";
import {LockTypeCreate} from "../schemas/LockTypeCreate";
import LockTypeModal from "../models/LockTypeModel";
import {LockTypeSearch} from "../schemas/LockTypeSearch";
import NotFound from "../errors/NotFound";
import {LockTypeUpdate} from "../schemas/LockTypeUpdate";

export const getAll: RequestHandler = async (req, res, next) => {

    try {
        let query = {};
        Object.assign(query, req.query);
        const {name, description, page}: LockTypeSearch = query;

        let [lockTypes, count] = await LockTypeModel.search({name, description}, page);

        if (count === -1) count = await LockTypeModal.count();

        res.status(200).send(new Result(
            true,
            count + '',
            lockTypes.map((x: LockType) => {
                return {
                    ...x,
                }
            })
        ))

    } catch (e) {
        next(e);
    }

}


export const create: RequestHandler = async (req, res, next) => {

    try {

        const lockTypeData = req.body as LockTypeCreate;

        const locktype: LockType = {
            id: 0,
            name: lockTypeData.name,
            description: lockTypeData.description
        }

        const result = await LockTypeModel.create(locktype)

        return res.status(200).send(new Result(
            true,
            'Lock type created',
            {
                ...result
            }
        ));
    } catch (e) {
        next(e);
    }

}

export const update: RequestHandler = async (req, res, next) => {
    try {

        const {id} = req.params;

        const lockType = await LockTypeModel.getById(~~(+id));

        if (!lockType) return next(new NotFound('No lock type with this ID'));

        const newLockType = await LockTypeModel.updateById(~~(+id), req.body as LockTypeUpdate);

        return res.status(200).send(new Result(
            true,
            "Lock type updated successfully",
            newLockType
        ))

    } catch (e) {
        next(e);
    }
}

export const deleteLockType: RequestHandler<{ id: string }> = async (req, res, next) => {
    try {

        const {id} = req.params;

        const lockType = await LockTypeModal.getById(~~(+id));

        if (!lockType) return next(new NotFound('No lock type with this ID'));

        await LockTypeModel.deleteById(lockType.id);

        return res.status(200).send(new Result(
            true,
            `Lock type with Id:${id} deleted`
        ));
    } catch (e) {
        next(e);
    }
}
