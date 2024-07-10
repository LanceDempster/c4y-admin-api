import { RequestHandler } from "express";
import { Result } from "../dto/Result";
import { KeyStorageSearch } from "../schemas/KeyStorageSearch";
import KeyStorageModal from "../models/KeyStorageModel";
import { KeyStorage } from "../interfaces/KeyStorage";
import { KeyStorageCreate } from "../schemas/KeyStorageCreate";
import NotFound from "../errors/NotFound";

export const create: RequestHandler = async (req, res, next) => {
  try {
    const keyStorageData = req.body as KeyStorageCreate;

    const keyStorage = {
      id: 0,
      name: keyStorageData.name,
      description: keyStorageData.description,
      level: keyStorageData.level,
    };

    const result = await KeyStorageModal.create(keyStorage);

    return res.status(200).send(
      new Result(true, "Key storage created", {
        ...result,
      }),
    );
  } catch (e) {
    next(e);
  }
};

export const getAll: RequestHandler = async (req, res, next) => {
  try {
    let query = {};
    Object.assign(query, req.query);
    const { name, description, level, page }: KeyStorageSearch = query;

    let [keys, count] = await KeyStorageModal.search(
      { name, description, level },
      page,
    );

    // if(count === -1) count = await ProductModel.count();

    res.status(200).send(
      new Result(
        true,
        count + "",
        keys.map((x: KeyStorage) => {
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

export const deleteProduct: RequestHandler<{ id: string }> = async (
  req,
  res,
  next,
) => {
  try {
    const { id } = req.params;

    const keyStorage = await KeyStorageModal.getById(~~+id);

    if (!keyStorage) return next(new NotFound("No key storage with this ID"));

    await KeyStorageModal.deleteById(keyStorage.id);

    return res
      .status(200)
      .send(new Result(true, `Product with Id:${id} deleted`));
  } catch (e) {
    next(e);
  }
};

// export const get: RequestHandler<{ id: string }> = async (req, res, next) => {
//   try {
//     const { id } = req.params;

//     const user = await ProductModel.getById(~~+id);

//     if (!user) return next(new NotFound("No Product with this ID"));

//     return res.status(200).send(new Result(true, "", user));
//   } catch (e) {
//     next(e);
//   }
// };

export const update: RequestHandler<{ id: string }> = async (
  req,
  res,
  next,
) => {
  try {
    const { id } = req.params;

    const keyStorage = await KeyStorageModal.getById(~~+id);

    if (!keyStorage) return next(new NotFound("No user with this ID"));

    const newKeyStorage = await KeyStorageModal.updateById(~~+id, req.body);

    return res
      .status(200)
      .send(
        new Result(true, "Key storage updated successfully", newKeyStorage),
      );
  } catch (e) {
    next(e);
  }
};
