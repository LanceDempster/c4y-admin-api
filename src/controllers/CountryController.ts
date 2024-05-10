import {RequestHandler} from "express";
import {Result} from "../dto/Result";
import {Country} from "../interfaces/Country";
import {CountrySearch} from "../schemas/CountrySearch";
import CountryModel from "../models/CountryModel";
import {CountryCreate} from "../schemas/CountryCreate";
import exp from "node:constants";
import ProductModel from "../models/ProductModel";
import NotFound from "../errors/NotFound";
import CountryModal from "../models/CountryModel";
import countryModel from "../models/CountryModel";
import {CountryUpdate} from "../schemas/CountryUpdate";

export const getAll: RequestHandler = async (req, res, next) => {

    try {
        let query = {};
        Object.assign(query, req.query);
        const {name, code, page}: CountrySearch = query;

        let [countries, count] = await CountryModel.search({name, code}, page);

        if (count === -1) count = await CountryModel.count();

        res.status(200).send(new Result(
            true,
            count + '',
            countries.map((x: Country) => {
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

        const productData = req.body as CountryCreate;

        const country = {
            id: 0,
            name: productData.name,
            code: productData.code,
        }

        const result = await CountryModel.create(country)

        return res.status(200).send(new Result(
            true,
            'Country created',
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

        const country = await CountryModel.getById(~~(+id));

        if (!country) return next(new NotFound('No country with this ID'));

        const newCountry = await CountryModel.updateById(~~(+id),  req.body as CountryUpdate);

        return res.status(200).send(new Result(
            true,
            "Country updated successfully",
            newCountry
        ))

    } catch (e) {
        next(e);
    }
}

export const deleteCountry: RequestHandler<{ id: string }> = async (req, res, next) => {
    try {

        const {id} = req.params;

        const country = await CountryModel.getById(~~(+id));

        if (!country) return next(new NotFound('No Country with this ID'));

        await CountryModal.deleteById(country.id);

        return res.status(200).send(new Result(
            true,
            `Country with Id:${id} deleted`
        ));
    } catch (e) {
        next(e);
    }
}
