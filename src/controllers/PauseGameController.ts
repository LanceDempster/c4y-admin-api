import {RequestHandler} from "express";
import {Result} from "../dto/Result";
import NotFound from "../errors/NotFound";
import {PauseGameSearch} from "../schemas/PauseGameSearch";
import PausedGameModel from "../models/PauseGameModel";
import {PauseGame} from "../interfaces/PauseGame";
import {PauseGameCreate} from "../schemas/PauseGameCreate";
import PauseGameModel from "../models/PauseGameModel";
import {PauseGameUpdate} from "../schemas/PauseGameUpdate";
import PauseGameModal from "../models/PauseGameModel";

export const getAll: RequestHandler = async (req, res, next) => {

    try {
        let query = {};
        Object.assign(query, req.query);
        const {name, description, page}: PauseGameSearch = query;

        let [pausedGames, count] = await PausedGameModel.search({name, description}, page);

        if (count === -1) count = await PausedGameModel.count();

        res.status(200).send(new Result(
            true,
            count + '',
            pausedGames.map((x: PauseGame) => {
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

        const pauseGameData = req.body as PauseGameCreate;

        const pauseGame: PauseGame = {
            id: 0,
            name: pauseGameData.name,
            description: pauseGameData.description
        }

        const result = await PauseGameModel.create(pauseGame)

        return res.status(200).send(new Result(
            true,
            'Pause game created',
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

        const pauseGame = await PauseGameModel.getById(~~(+id));

        if (!pauseGame) return next(new NotFound('No pause game with this ID'));

        const newPauseGame = await PauseGameModel.updateById(~~(+id), req.body as PauseGameUpdate);

        return res.status(200).send(new Result(
            true,
            "Pause game updated successfully",
            newPauseGame
        ))

    } catch (e) {
        next(e);
    }
}

export const deletePauseGame: RequestHandler<{ id: string }> = async (req, res, next) => {
    try {

        const {id} = req.params;

        const pauseGame = await PauseGameModal.getById(~~(+id));

        if (!pauseGame) return next(new NotFound('No pause game with this ID'));

        await PauseGameModel.deleteById(pauseGame.id);

        return res.status(200).send(new Result(
            true,
            `Pause game with Id:${id} deleted`
        ));
    } catch (e) {
        next(e);
    }
}
