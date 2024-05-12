import {RequestHandler} from "express";
import {Result} from "../dto/Result";
import {RuleSearch} from "../schemas/RuleSearch";
import RuleModel from "../models/RuleModel";
import {Rule} from "../interfaces/Rule";
import {RuleCreate} from "../schemas/RuleCreate";
import NotFound from "../errors/NotFound";
import {RuleUpdate} from "../schemas/RuleUpdate";

export const getAll: RequestHandler = async (req, res, next) => {

    try {
        let query = {};
        Object.assign(query, req.query);
        const {name, description, page}: RuleSearch = query;

        let [rules, count] = await RuleModel.search({name, description}, page);

        if (count === -1) count = await RuleModel.count();

        res.status(200).send(new Result(
            true,
            count + '',
            rules.map((x: Rule) => {
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

        const ruleData = req.body as RuleCreate;

        const rule: Rule = {
            id: 0,
            name: ruleData.name,
            description: ruleData.description
        }

        const result = await RuleModel.create(rule)

        return res.status(200).send(new Result(
            true,
            'Rule created',
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

        const rule = await RuleModel.getById(~~(+id));

        if (!rule) return next(new NotFound('No rule with this ID'));

        const newRule = await RuleModel.updateById(~~(+id), req.body as RuleUpdate);

        return res.status(200).send(new Result(
            true,
            "Rule updated successfully",
            newRule
        ))

    } catch (e) {
        next(e);
    }
}

export const deleteRule: RequestHandler<{ id: string }> = async (req, res, next) => {
    try {

        const {id} = req.params;

        const rule = await RuleModel.getById(~~(+id));

        if (!rule) return next(new NotFound('No rule with this ID'));

        await RuleModel.deleteById(rule.id);

        return res.status(200).send(new Result(
            true,
            `Rule with Id:${id} deleted`
        ));
    } catch (e) {
        next(e);
    }
}
