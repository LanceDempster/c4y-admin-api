import {RequestHandler} from "express";
import {Result} from "../dto/Result";
import NotFound from "../errors/NotFound";
import {MessageSearch} from "../schemas/MessageSearch";
import MessageModal from "../models/MessageModel";
import {MessageCreate} from "../schemas/MessageCreate";
import {Message} from "../interfaces/Message";
import MessageModel from "../models/MessageModel";
import {MessageUpdate, MessageUpdateSchema} from "../schemas/MessageUpdate";

export const getAll: RequestHandler = async (req, res, next) => {

    try {
        let query = {};
        Object.assign(query, req.query);
        const {name, description, page}: MessageSearch = query;

        let [messages, count] = await MessageModal.search({name, description}, page);

        if (count === -1) count = await MessageModel.count();

        res.status(200).send(new Result(
            true,
            count + '',
            messages.map((x: Message) => {
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

        const messageData = req.body as MessageCreate;

        const message: Message = {
            id: 0,
            name: messageData.name,
            description: messageData.description
        }

        const result = await MessageModal.create(message)

        return res.status(200).send(new Result(
            true,
            'Message created',
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

        const message = await MessageModel.getById(~~(+id));

        if (!message) return next(new NotFound('No message with this ID'));

        const newMessage = await MessageModel.updateById(~~(+id), req.body as MessageUpdate);

        return res.status(200).send(new Result(
            true,
            "Message updated successfully",
            newMessage
        ))

    } catch (e) {
        next(e);
    }
}

export const deleteMessage: RequestHandler<{ id: string }> = async (req, res, next) => {
    try {

        const {id} = req.params;

        const message = await MessageModel.getById(~~(+id));

        if (!message) return next(new NotFound('No message with this ID'));

        await MessageModel.deleteById(message.id);

        return res.status(200).send(new Result(
            true,
            `Message with Id:${id} deleted`
        ));
    } catch (e) {
        next(e);
    }
}
