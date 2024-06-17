import { RequestHandler } from "express";
import { Result } from "../dto/Result";
import NotFound from "../errors/NotFound";

import { RewardSearch as RewardSearch } from "../schemas/RewardSearch";
import { Reward } from "../interfaces/Reward";
import RewardModal from "../models/RewardModel";
import { RewardCreate } from "../schemas/RewardCreate";
import { RewardUpdate } from "../schemas/RewardUpdate";

export const getAll: RequestHandler = async (req, res, next) => {
  try {
    let query = {};
    Object.assign(query, req.query);
    const { name, description, rewardImage, rewardUrl, page }: RewardSearch =
      query;

    let [rewards, count] = await RewardModal.search(
      { name, description, rewardImage, rewardUrl },
      page,
    );

    if (count === -1) count = await RewardModal.count();

    res.status(200).send(
      new Result(
        true,
        count + "",
        rewards.map((x: Reward) => {
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
    const rewardData = req.body as RewardCreate;

    const reward: Reward = {
      id: 0,
      name: rewardData.name,
      description: rewardData.description,
      rewardImage: rewardData.rewardImage,
      rewardUrl: rewardData.rewardUrl,
    };

    const result = await RewardModal.create(reward);

    return res.status(200).send(
      new Result(true, "Reward created", {
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

    const reward = await RewardModal.getById(~~+id);

    if (!reward) return next(new NotFound("No reward with this ID"));

    const newReward = await RewardModal.updateById(~~+id, req.body as RewardUpdate);

    return res
      .status(200)
      .send(new Result(true, "Reward updated successfully", newReward));
  } catch (e) {
    next(e);
  }
};

export const deleteRewards: RequestHandler<{ id: string }> = async (req, res, next) => {
    try {
        const {id} = req.params;

        const reward = await RewardModal.getById(~~(+id));

        if (!reward) return next(new NotFound('No reward with this ID'));

        await RewardModal.deleteById(reward.id);

        return res.status(200).send(new Result(
            true,
            `reward with Id:${id} deleted`
        ));
    } catch (e) {
        next(e);
    }
}
