import {RequestHandler} from "express";
import {Result} from "../dto/Result";
import {StoryStatusSearch} from "../schemas/StoryStatusSearch";
import StoryStatusModel from "../models/StoryStatusModel";
import {StoryStatus} from "../interfaces/StoryStatus";
import {StoryStatusCreate} from "../schemas/StoryStatusCreate";
import NotFound from "../errors/NotFound";
import {StoryStatusUpdate} from "../schemas/StoryStatusUpdate";

export const getAll: RequestHandler = async (req, res, next) => {

    try {
        let query = {};
        Object.assign(query, req.query);
        const {status, page}: StoryStatusSearch = query;

        let [storyStatus, count] = await StoryStatusModel.search({status}, page);

        if (count === -1) count = await StoryStatusModel.count();

        res.status(200).send(new Result(
            true,
            count + '',
            storyStatus.map((x: StoryStatus) => {

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
        const storyStatusData = req.body as StoryStatusCreate;

        const storyStatus: StoryStatus = {
            id: 0,
            status: storyStatusData.status,
        }

        const result = await StoryStatusModel.create(storyStatus)

        return res.status(200).send(new Result(
            true,
            'Story Status created',
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

        const storyStatus = await StoryStatusModel.getById(~~(+id));

        if (!storyStatus) return next(new NotFound('No story status with this ID'));

        const newStoryStatus = await StoryStatusModel.updateById(~~(+id), req.body as StoryStatusUpdate);

        return res.status(200).send(new Result(
            true,
            "Story status updated successfully",
            newStoryStatus
        ))

    } catch (e) {
        next(e);
    }
}

export const deleteStoryStatus: RequestHandler<{ id: string }> = async (req, res, next) => {
    try {

        const {id} = req.params;

        const storyStatus = await StoryStatusModel.getById(~~(+id));

        if (!storyStatus) return next(new NotFound('No game status with this ID'));

        await StoryStatusModel.deleteById(storyStatus.id);

        return res.status(200).send(new Result(
            true,
            `Story status with Id:${id} deleted`
        ));
    } catch (e) {
        next(e);
    }
}
