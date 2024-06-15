import { RequestHandler } from "express";
import { Result } from "../dto/Result";
import NotFound from "../errors/NotFound";

import ToyModal from "../models/ToyModel";
import { ToySearch } from "../schemas/ToysSearch";
import { Toy } from "../interfaces/Toy";
import { ToyCreate } from "../schemas/ToyCreate";
import { ToyUpdate } from "../schemas/ToysUpdate";

export const getAll: RequestHandler = async (req, res, next) => {
  try {
    let query = {};
    Object.assign(query, req.query);
    const { name, description, toysImage, toysUrl, page }: ToySearch = query;

    let [toys, count] = await ToyModal.search(
      { name, description, toysImage, toysUrl },
      page,
    );

    if (count === -1) count = await ToyModal.count();

    res.status(200).send(
      new Result(
        true,
        count + "",
        toys.map((x: Toy) => {
          return {
            ...x,
          };
        }),
      ),
    );
  } catch (e) {
    next(e);
  }
};

export const create: RequestHandler = async (req, res, next) => {
  try {
    const toyData = req.body as ToyCreate;

    const toy: Toy = {
      id: 0,
      name: toyData.name,
      description: toyData.description,
      toyImage: toyData.toyImage,
      toyUrl: toyData.toyUrl,
    };

    const result = await ToyModal.create(toy);

    return res.status(200).send(
      new Result(true, "Toy created", {
        ...result,
      }),
    );
  } catch (e) {
    next(e);
  }
};

export const update: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;

    const toy = await ToyModal.getById(~~+id);

    if (!toy) return next(new NotFound("No toy with this ID"));

    const newToy = await ToyModal.updateById(
      ~~+id,
      req.body as ToyUpdate,
    );

    return res
      .status(200)
      .send(
        new Result(true, "Toy updated successfully", newToy),
      );
  } catch (e) {
    next(e);
  }
};

export const deleteToys: RequestHandler<{ id: string }> = async (req, res, next) => {
    try {
        const {id} = req.params;

        const toy = await ToyModal.getById(~~(+id));

        if (!toy) return next(new NotFound('No toy with this ID'));

        await ToyModal.deleteById(toy.id);

        return res.status(200).send(new Result(
            true,
            `Toys with Id:${id} deleted`
        ));
    } catch (e) {
        next(e);
    }
}
