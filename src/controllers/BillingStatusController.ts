import {RequestHandler} from "express";
import {Result} from "../dto/Result";
import {BillingStatusSearch} from "../schemas/BillingStatusSearch";
import BillingStatusModel from "../models/BillingStatusModel";
import {Rule} from "../interfaces/Rule";
import {BillingStatusCreate} from "../schemas/BillingStatusCreate";
import NotFound from "../errors/NotFound";
import {RuleUpdate} from "../schemas/RuleUpdate";
import BillingStatusModal from "../models/BillingStatusModel";
import { BillingStatus } from "../interfaces/BillingStatus";
import { BillingStatusUpdate } from "../schemas/BillingStatusUpdate";

export const getAll: RequestHandler = async (req, res, next) => {

    try {
        let query = {};
        Object.assign(query, req.query);
        const {code, description, page}: BillingStatusSearch = query;

        let [billingStatus, count] = await BillingStatusModel.search({code, description}, page);

        if (count === -1) count = await BillingStatusModel.count();

        res.status(200).send(new Result(
            true,
            count + '',
            billingStatus.map((x: Rule) => {
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

        const billingStatusData = req.body as BillingStatusCreate;

        const billingStatus: BillingStatus = {
            id: 0,
            status: billingStatusData.status,
            description: billingStatusData.description
        }

        const result = await BillingStatusModal.create(billingStatus)

        return res.status(200).send(new Result(
            true,
            'Billing Status created',
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

        const billingStatus = await BillingStatusModal.getById(~~(+id));

        if (!billingStatus) return next(new NotFound('No billing status with this ID'));

        const newBillingStatus = await BillingStatusModal.updateById(~~(+id), req.body as BillingStatusUpdate);

        return res.status(200).send(new Result(
            true,
            "Billing status updated successfully",
						newBillingStatus
        ))

    } catch (e) {
        next(e);
    }
}

export const deleteBillingStatus: RequestHandler<{ id: string }> = async (req, res, next) => {
    try {
        const {id} = req.params;

        const billingStatus = await BillingStatusModal.getById(~~(+id));

        if (!billingStatus) return next(new NotFound('No billing status with this ID'));

        await BillingStatusModal.deleteById(billingStatus.id);

        return res.status(200).send(new Result(
            true,
            `billing status with Id:${id} deleted`
        ));
    } catch (e) {
        next(e);
    }
}
