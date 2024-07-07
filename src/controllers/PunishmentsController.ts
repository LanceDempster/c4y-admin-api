import { RequestHandler } from "express";
import { Result } from "../dto/Result";
import NotFound from "../errors/NotFound";

import { RewardSearch as RewardSearch } from "../schemas/RewardSearch";
import { Reward } from "../interfaces/Reward";
import RewardModal from "../models/RewardModel";
import { RewardCreate } from "../schemas/RewardCreate";
import { RewardUpdate } from "../schemas/RewardUpdate";
import { PunishmentSearch } from "../schemas/PunishmentSearch";
import { Punishment } from "../interfaces/Punishment";
import PunishmentModal from "../models/PunishmentModel";
import { PunishmentCreate } from "../schemas/PunishmentCreate";
import { PunishmentUpdate } from "../schemas/PunishmentUpdate";
import { fromEnv } from "@aws-sdk/credential-providers"; // ES6 import
import multer from "multer";

export const getAll: RequestHandler = async (req, res, next) => {
  try {
    let query = {};
    Object.assign(query, req.query);
    const {
      name,
      description,
      punishmentImage,
      punishmentUrl,
      level,
      page,
    }: PunishmentSearch = query;

    let [punishments, count] = await PunishmentModal.search(
      { name, description, punishmentImage, punishmentUrl, level },
      page,
    );

    if (count === -1) count = await RewardModal.count();

    res.status(200).send(
      new Result(
        true,
        count + "",
        punishments.map((x: Punishment) => {
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
  // Create an Amazon S3 bucket. The epoch timestamp is appended
  // to the name to make it unique.

  try {
    const punishmentData = req.body as PunishmentCreate;

    const punishment: Punishment = {
      id: 0,
      name: punishmentData.name,
      description: punishmentData.description,
      punishmentImage: punishmentData.punishmentImage,
      // @ts-ignore
      punishmentUrl: req?.file?.location,
      level: punishmentData.level,
    };

    const result = await PunishmentModal.create(punishment);

    return res.status(200).send(
      new Result(true, "Punishment created", {
        ...result,
      }),
    );
  } catch (e) {
    next(e);
  }

  return res.status(200).send(new Result(true, "Punishment created", {}));
};

export const update: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;

    const punishment = await PunishmentModal.getById(~~+id);

    if (!punishment) return next(new NotFound("No punishment with this ID"));

    let newPunishment;

    if (req?.file) {
      // @ts-ignore
      req.body.punishmentUrl = req.file.location;
    }

    newPunishment = await PunishmentModal.updateById(
      ~~+id,
      req.body as PunishmentUpdate,
    );

    return res
      .status(200)
      .send(new Result(true, "Punishment updated successfully", newPunishment));
  } catch (e) {
    next(e);
  }
};

export const deletePunishment: RequestHandler<{ id: string }> = async (
  req,
  res,
  next,
) => {
  try {
    const { id } = req.params;

    const punishment = await PunishmentModal.getById(~~+id);

    if (!punishment) return next(new NotFound("No punishment with this ID"));

    await PunishmentModal.deleteById(punishment.id);

    return res
      .status(200)
      .send(new Result(true, `Punishment with Id:${id} deleted`));
  } catch (e) {
    next(e);
  }
};
