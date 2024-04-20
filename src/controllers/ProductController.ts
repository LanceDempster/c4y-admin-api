import { RequestHandler } from "express";
import ProductModel from "../models/ProductModel";
import NotFound from "../errors/NotFound";
import { Result } from "../dto/Result";
import { Product } from "../interfaces/Product";
import { hash } from "bcrypt";
import { ProductSearch } from "../schemas/ProductSearch";
import { ProductCreate } from "../schemas/ProductCreate";

export const create: RequestHandler = async (req, res, next) => {

    try {

        const productData = req.body as ProductCreate;

        const product: Product = {
            id: 0,
            description: productData.description,
            prodStatus: productData.prodStatus,
        }

        const result = await ProductModel.create(product)

        return res.status(200).send(new Result(
            true,
            'Product created',
            {
                ...result
            }
        ));
    }

    catch (e) {
        next(e);
    }

}

export const getAll: RequestHandler = async (req, res, next) => {

    try {
        let query = {};
        Object.assign(query, req.query);
        const { description, prodStatus, page }: ProductSearch = query;

        let [users, count] = await ProductModel.search({ description, prodStatus }, page);

        // if(count === -1) count = await ProductModel.count();

        res.status(200).send(new Result(
            true,
            count+'',
            users.map((x: Product) => {
                return {
                    ...x,
                }
            })
        ))

    }

    catch (e) {
        next(e);
    }

}

export const deleteProduct: RequestHandler<{ id: string }> = async (req, res, next) => {
    try {

        const { id } = req.params;

        const user = await ProductModel.getById(~~(+id));

        if (!user) return next(new NotFound('No Product with this ID'));

        await ProductModel.deleteById(user.id);

        return res.status(200).send(new Result(
            true,
            `Product with Id:${id} deleted`
        ));
    }
    catch (e) {
        next(e);
    }
}

export const get: RequestHandler<{ id: string }> = async (req, res, next) => {
    try {

        const { id } = req.params;

        const user = await ProductModel.getById(~~(+id));

        if (!user) return next(new NotFound('No Product with this ID'));

        return res.status(200).send(new Result(
            true,
            '',
            user
        ));

    }
    catch (e) {
        next(e);
    }
}

export const update: RequestHandler<{ id: string }> = async (req, res, next) => {
    try {

        const { id } = req.params;

        const user = await ProductModel.getById(~~(+id));

        if (!user) return next(new NotFound('No user with this ID'));

        const newUser = await ProductModel.updateById(~~(+id), req.body);

        return res.status(200).send(new Result(
            true,
            "Product updated successfully",
            newUser
        ))

    }
    catch (e) {
        next(e);
    }
}