import {RequestHandler} from "express";
import {Result} from "../dto/Result";
import {GameStatusSearch} from "../schemas/GameStatusSearch";
import NotFound from "../errors/NotFound";
import GameStatusModel from "../models/GameStatusModel";
import {GameStatus} from "../interfaces/GameStatus";
import {GameStatusCreate} from "../schemas/GameStatusCreate";
import {GameStatusUpdate} from "../schemas/GameStatusUpdate";
import GameStatusRouter from "../api/GameStatusRouter";

export const getAll: RequestHandler = async (req, res, next) => {

    try {
        let query = {};
        Object.assign(query, req.query);
        const {name, page}: GameStatusSearch = query;

        let [gameStatus, count] = await GameStatusModel.search({name}, page);

        if (count === -1) count = await GameStatusModel.count();

        res.status(200).send(new Result(
            true,
            count + '',
            gameStatus.map((x: GameStatus) => {
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

        const gameStatusData = req.body as GameStatusCreate;

        const gameStatus: GameStatus = {
            id: 0,
            name: gameStatusData.name,
        }

        const result = await GameStatusModel.create(gameStatus)

        return res.status(200).send(new Result(
            true,
            'Device Type created',
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

        const gameStatus = await GameStatusModel.getById(~~(+id));

        if (!gameStatus) return next(new NotFound('No game status with this ID'));

        const newGameStatus = await GameStatusModel.updateById(~~(+id), req.body as GameStatusUpdate);

        return res.status(200).send(new Result(
            true,
            "Game status updated successfully",
            newGameStatus
        ))

    } catch (e) {
        next(e);
    }
}

export const deleteGameStatus: RequestHandler<{ id: string }> = async (req, res, next) => {
    try {

        const {id} = req.params;

        const gameStatus = await GameStatusModel.getById(~~(+id));

        if (!gameStatus) return next(new NotFound('No game status with this ID'));

        await GameStatusModel.deleteById(gameStatus.id);

        return res.status(200).send(new Result(
            true,
            `Game status with Id:${id} deleted`
        ));
    } catch (e) {
        next(e);
    }
}
