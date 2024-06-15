import { RequestHandler } from "express";
import { Result } from "../dto/Result";
import NotFound from "../errors/NotFound";

import { ChallengeSearch } from "../schemas/ChallengeSearch";
import ChallengeModal from "../models/ChallengeModel";
import { Challenge } from "../interfaces/Challenge";
import { ChallengeCreate } from "../schemas/ChallengeCreate";
import { ChallengeUpdate } from "../schemas/ChallengeUpdate";

export const getAll: RequestHandler = async (req, res, next) => {
  try {
    let query = {};
    Object.assign(query, req.query);
    const {
      name,
      description,
      challengeImage,
      challengeUrl,
      page,
    }: ChallengeSearch = query;

    let [challenges, count] = await ChallengeModal.search(
      { name, description, challengeImage, challengeUrl },
      page,
    );

    if (count === -1) count = await ChallengeModal.count();

    res.status(200).send(
      new Result(
        true,
        count + "",
        challenges.map((x: Challenge) => {
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
    const challengeData = req.body as ChallengeCreate;

    const challenge: Challenge = {
      id: 0,
      name: challengeData.name,
      description: challengeData.description,
      challengeImage: challengeData.challengeImage,
      challengeUrl: challengeData.challengeUrl,
    };

    const result = await ChallengeModal.create(challenge);

    return res.status(200).send(
      new Result(true, "Challenge created", {
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

    const challenge = await ChallengeModal.getById(~~+id);

    if (!challenge) return next(new NotFound("No challenge with this ID"));

    const newChallenge = await ChallengeModal.updateById(
      ~~+id,
      req.body as ChallengeUpdate,
    );

    return res
      .status(200)
      .send(
        new Result(true, "Challenge updated successfully", newChallenge),
      );
  } catch (e) {
    next(e);
  }
};

export const deleteChallenges: RequestHandler<{ id: string }> = async (req, res, next) => {
    try {
        const {id} = req.params;

        const challenge = await ChallengeModal.getById(~~(+id));

        if (!challenge) return next(new NotFound('No challenge with this ID'));

        await ChallengeModal.deleteById(challenge.id);

        return res.status(200).send(new Result(
            true,
            `Challenges with Id:${id} deleted`
        ));
    } catch (e) {
        next(e);
    }
}
