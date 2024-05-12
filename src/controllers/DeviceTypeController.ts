import {RequestHandler} from "express";
import {Result} from "../dto/Result";
import {DeviceTypeSearch} from "../schemas/DeviceTypeSearch";
import NotFound from "../errors/NotFound";
import DeviceTypeModel from "../models/DeviceTypeModel";
import {DeviceTypeCreate} from "../schemas/DeviceTypeCreate";
import {DeviceType} from "../interfaces/DeviceType";
import DeviceTypeModal from "../models/DeviceTypeModel";
import {DeviceTypeUpdate} from "../schemas/DeviceTypeUpdate";
import deviceTypeModel from "../models/DeviceTypeModel";

export const getAll: RequestHandler = async (req, res, next) => {

    try {
        let query = {};
        Object.assign(query, req.query);
        const {name, description, page}: DeviceTypeSearch = query;

        let [devicesTypes, count] = await DeviceTypeModel.search({name, description}, page);

        if (count === -1) count = await DeviceTypeModel.count();

        res.status(200).send(new Result(
            true,
            count + '',
            devicesTypes.map((x: DeviceType) => {
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

        const deviceTypeData = req.body as DeviceTypeCreate;

        const deviceType: DeviceType = {
            id: 0,
            name: deviceTypeData.name,
            description: deviceTypeData.description
        }

        const result = await DeviceTypeModel.create(deviceType)

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

        const deviceType = await DeviceTypeModal.getById(~~(+id));

        if (!deviceType) return next(new NotFound('No device type with this ID'));

        const newDeviceType = await DeviceTypeModel.updateById(~~(+id), req.body as DeviceTypeUpdate);

        return res.status(200).send(new Result(
            true,
            "Device type updated successfully",
            newDeviceType
        ))

    } catch (e) {
        next(e);
    }
}

export const deleteDeviceType: RequestHandler<{ id: string }> = async (req, res, next) => {
    try {

        const {id} = req.params;

        const deviceType = await DeviceTypeModal.getById(~~(+id));

        if (!deviceType) return next(new NotFound('No Device Type with this ID'));

        await DeviceTypeModal.deleteById(deviceType.id);

        return res.status(200).send(new Result(
            true,
            `with Id:${id} deleted`
        ));
    } catch (e) {
        next(e);
    }
}
