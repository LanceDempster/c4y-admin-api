import { Router } from "express";
import { authAdmin } from "../middlewares/Auth";
import * as rewardsController from "../controllers/RewardsController";
import { bodyValidation } from "../middlewares/Validation";
import { RewardCreateSchema } from "../schemas/RewardCreate";
import { RewardUpdateSchema } from "../schemas/RewardUpdate";

import multer from "multer";
import { fromEnv } from "@aws-sdk/credential-providers"; // ES6 import

import crypto from "crypto";

import { S3Client } from "@aws-sdk/client-s3";
import multerS3 from "multer-s3";

const s3Client = new S3Client({
  region: "eu-west-2",
  credentials: fromEnv(),
});

const bucketName = `c4ylifestyle`;

const upload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: bucketName,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      cb(null, crypto.randomUUID());
    },
  }),
});

const RewardsRouter = Router();

RewardsRouter.get("/", authAdmin, rewardsController.getAll);

// productRouter.get('/:id', authAdmin, ProductController.get );

RewardsRouter.post(
  "/create",
  authAdmin,
  upload.single("image"),
  bodyValidation(RewardCreateSchema),
  rewardsController.create,
);

RewardsRouter.put(
  "/:id",
  authAdmin,
  upload.single("image"),
  bodyValidation(RewardUpdateSchema),
  rewardsController.update,
);

RewardsRouter.delete("/:id", authAdmin, rewardsController.deleteRewards);

export default RewardsRouter;
