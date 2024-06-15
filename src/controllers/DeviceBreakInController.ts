import { RequestHandler } from "express";
import { Result } from "../dto/Result";
import NotFound from "../errors/NotFound";

import { ChallengeSearch } from "../schemas/ChallengeSearch";
import ChallengeModal from "../models/ChallengeModel";
import { Challenge } from "../interfaces/Challenge";
import { ChallengeCreate } from "../schemas/ChallengeCreate";
import { ChallengeUpdate } from "../schemas/ChallengeUpdate";
import { DeviceBreakInSearch } from "../schemas/DeviceBreakInSearch";
import { DeviceBreakIn } from "../interfaces/DeviceBreakIn";
import DeviceBreakInModal from "../models/DeviceBreakInModel";
import { DeviceBreakInCreate } from "../schemas/DeviceBreakInCreate";
import { DeviceBreakInUpdate } from "../schemas/DeviceBreakInUpdate";

export const getAll: RequestHandler = async (req, res, next) => {
  try {
    let query = {};
    Object.assign(query, req.query);
    const { weekNumber, description, page }: DeviceBreakInSearch = query;

    let [deviceBreakIns, count] = await DeviceBreakInModal.search(
      { weekNumber, description },
      page,
    );

    if (count === -1) count = await DeviceBreakInModal.count();

    res.status(200).send(
      new Result(
        true,
        count + "",
        deviceBreakIns.map((x: DeviceBreakIn) => {
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
    const deviceBreakInData = req.body as DeviceBreakInCreate;

    const deviceBreakIn: DeviceBreakIn = {
      id: 0,
      weekNumber: deviceBreakInData.weekNumber,
      description: deviceBreakInData.description,
    };

    const result = await DeviceBreakInModal.create(deviceBreakIn);

    return res.status(200).send(
      new Result(true, "Device break in created", {
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

    const deviceBreakIn = await DeviceBreakInModal.getById(~~+id);

    if (!deviceBreakIn) return next(new NotFound("No device break in with this ID"));

    const newDeviceBreakIn = await DeviceBreakInModal.updateById(
      ~~+id,
      req.body as DeviceBreakInUpdate,
    );

    return res
      .status(200)
      .send(
        new Result(true, "Device break in updated successfully", newDeviceBreakIn),
      );
  } catch (e) {
    next(e);
  }
};

export const deleteDeviceBreakIn: RequestHandler<{ id: string }> = async (req, res, next) => {
    try {
        const {id} = req.params;

        const deviceBreakIn = await DeviceBreakInModal.getById(~~(+id));

        if (!deviceBreakIn) return next(new NotFound('No device break in with this ID'));

        await DeviceBreakInModal.deleteById(deviceBreakIn.id);

        return res.status(200).send(new Result(
            true,
            `Device break in with Id:${id} deleted`
        ));
    } catch (e) {
        next(e);
    }
}
