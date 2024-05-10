import {RequestHandler} from "express";
import {Result} from "../dto/Result";
import NotFound from "../errors/NotFound";
import GameStatusModel from "../models/GameStatusModel";
import {GameStatus} from "../interfaces/GameStatus";
import {GameStatusCreate} from "../schemas/GameStatusCreate";
import {GameStatusUpdate} from "../schemas/GameStatusUpdate";
import GameStatusRouter from "../api/GameStatusRouter";
import {HealthChechinSearch} from "../schemas/HealthChechinSearch";
import HealthCheckinModel from "../models/HealthCheckinModel";
import {HealthCheckinCreate} from "../schemas/HealthCheckinCreate";
import {HealthCheckin} from "../interfaces/HealthCheckin";
import HealthCheckinModal from "../models/HealthCheckinModel";
import {HealthCheckinUpdate} from "../schemas/HealthCheckinUpdate";

export const getAll: RequestHandler = async (req, res, next) => {

    try {
        let query = {};
        Object.assign(query, req.query);
        const {name, description, page}: HealthChechinSearch = query;

        let [healthCheckin, count] = await HealthCheckinModel.search({name}, page);

        if (count === -1) count = await HealthCheckinModel.count();

        res.status(200).send(new Result(
            true,
            count + '',
            healthCheckin.map((x: GameStatus) => {
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

        const healthCheckinData = req.body as HealthCheckinCreate;

        const healthCheckin: HealthCheckin = {
            id: 0,
            name: healthCheckinData.name,
            description: healthCheckinData.description
        }

        const result = await HealthCheckinModel.create(healthCheckin)

        return res.status(200).send(new Result(
            true,
            'Health checkin created',
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

        const healthCheckin = await HealthCheckinModel.getById(~~(+id));

        if (!healthCheckin) return next(new NotFound('No health checkin with this ID'));

        const newHealthCheckin = await HealthCheckinModal.updateById(~~(+id), req.body as HealthCheckinUpdate);

        return res.status(200).send(new Result(
            true,
            "Health checking updated successfully",
            newHealthCheckin
        ))

    } catch (e) {
        next(e);
    }
}

export const deleteHealthCheckin: RequestHandler<{ id: string }> = async (req, res, next) => {
    try {

        const {id} = req.params;

        const healthCheckin = await HealthCheckinModal.getById(~~(+id));

        if (!healthCheckin) return next(new NotFound('No health checkin with this ID'));

        await HealthCheckinModel.deleteById(healthCheckin.id);

        return res.status(200).send(new Result(
            true,
            `Game status with Id:${id} deleted`
        ));
    } catch (e) {
        next(e);
    }
}
