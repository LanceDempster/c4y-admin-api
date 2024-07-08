import { Router } from "express";
import { authAdmin } from "../middlewares/Auth";
import * as PunishmentsController from "../controllers/PunishmentsController";
import { PunishmentCreateSchema } from "../schemas/PunishmentCreate";
import { bodyValidation } from "../middlewares/Validation";
import { PunishmentUpdateSchema } from "../schemas/PunishmentUpdate";

import multer from "multer";
import { fromEnv } from "@aws-sdk/credential-providers"; // ES6 import

import crypto from 'crypto'

import {
  S3Client,
} from "@aws-sdk/client-s3";
import multerS3 from "multer-s3";

const PunishmentsRouter = Router();

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

PunishmentsRouter.get("/", PunishmentsController.getAll);

// productRouter.get('/:id', authAdmin, ProductController.get );

PunishmentsRouter.post(
  "/create",
  authAdmin,
  upload.single("image"),
  bodyValidation(PunishmentCreateSchema),
  PunishmentsController.create,
);

PunishmentsRouter.put(
  "/:id",
  authAdmin,
  upload.single("image"),
  bodyValidation(PunishmentUpdateSchema),
  PunishmentsController.update,
);

PunishmentsRouter.delete(
  "/:id",
  authAdmin,
  PunishmentsController.deletePunishment,
);

export default PunishmentsRouter;
