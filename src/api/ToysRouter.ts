import { Router } from "express";
import { authAdmin } from "../middlewares/Auth";
import * as ToysController from "../controllers/ToysController";
import { bodyValidation } from "../middlewares/Validation";
import { ChallengeCreateSchema } from "../schemas/ChallengeCreate";
import { ChallengeUpdateSchema } from "../schemas/ChallengeUpdate";
import { ToyCreateSchema } from "../schemas/ToyCreate";

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

const ToysRouter = Router();

ToysRouter.get("/", authAdmin, ToysController.getAll);

// productRouter.get('/:id', authAdmin, ProductController.get );

ToysRouter.post(
  "/create",
  authAdmin,
  upload.single("image"),
  bodyValidation(ToyCreateSchema),
  ToysController.create,
);

ToysRouter.put(
  "/:id",
  authAdmin,
  upload.single("image"),
  bodyValidation(ChallengeUpdateSchema),
  ToysController.update,
);

ToysRouter.delete("/:id", authAdmin, ToysController.deleteToys);

export default ToysRouter;
