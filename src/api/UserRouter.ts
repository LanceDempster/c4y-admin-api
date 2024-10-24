import {Router} from "express";
import {bodyValidation, queryValidation} from "../middlewares/Validation";
import {LoginSchema} from "../schemas/Login";
import * as UserController from "../controllers/UserController";
import {UserRegisterSchema} from "../schemas/UserResister";
import {ForgotPasswordSchema} from "../schemas/ForgotPassword";
import {ResetPasswordSchema} from "../schemas/ResetPassword";
import {UserSearchSchema} from "../schemas/UserSearch";
import {authAdmin, authUser} from "../middlewares/Auth";
import {UserUpdateSchema} from "../schemas/UserUpdate";
import {ChangePasswordSchema} from "../schemas/changePasswordSchema";

import multer from "multer";
import {fromEnv} from "@aws-sdk/credential-providers"; // ES6 import
import crypto from "crypto";

import {S3Client} from "@aws-sdk/client-s3";
import multerS3 from "multer-s3";
import * as PauseGameController from "../controllers/PauseGameController";

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
      cb(null, {fieldName: file.fieldname});
    },
    key: function (req, file, cb) {
      cb(null, crypto.randomUUID());
    },
  }),
});

const userRouter = Router();

userRouter.get('/get-adventures', authUser, UserController.getAdventures);

userRouter.post('/register-adventure', authUser, UserController.registerAdventure);

userRouter.post(
  '/submit-adventure',
  authUser,
  upload.single("verification_image"),
  UserController.submitAdventure
);

userRouter.get(
  '/get-adventure-verification',
  authAdmin,
  UserController.getAdventureVerification
)

userRouter.post(
  '/admin-verify-adventure',
  authAdmin,
  UserController.adminVerifyAdventure
)

userRouter.get('/community-solo-leader-board', authUser, UserController.getSoloLeaderBoard);

userRouter.get('/community-news', authUser, UserController.getCommunityNews);

userRouter.get('/get-medals', authUser, UserController.getMedals);

userRouter.get('/get-events', authUser, UserController.getEvents);

userRouter.post('/register-event', authUser, UserController.registerEvent)

userRouter.post('/extend-game', authUser, UserController.extendGame);

userRouter.get('/get-paused-game-types', authUser, PauseGameController.getAll);

userRouter.post("/pause-game", authUser, UserController.pauseGame);

userRouter.post("/resume-game", authUser, UserController.resumeGame);

userRouter.get("/rank", authUser, UserController.getUserRank);

userRouter.get(
  "/detailed-analysis",
  authUser,
  UserController.getDetailsAnalysis,
);

userRouter.get("/orgasm-types", authUser, UserController.getOrgasmTypes);

userRouter.post("/record-orgasm", authUser, UserController.recordOrgasm);

userRouter.post(
  "/update-user-time-limits",
  authUser,
  UserController.updateUserTimeLimits,
);

userRouter.get(
  "/get-community-images-for-verification",
  authAdmin,
  UserController.getCommunityImagesForVerification,
);

userRouter.post(
  "/verify-community-image",
  authAdmin,
  UserController.verifyCommunityImage,
);

userRouter.get(
  "/get-game-verification-attempt",
  authUser,
  UserController.getGameVerificationAttempt,
);

userRouter.post(
  "/upload-verification-image",
  authUser,
  upload.single("verification_image"),
  UserController.uploadVerificationImage,
);

userRouter.get("/check-achievement", authUser, UserController.checkAchievement);

userRouter.post(
  "/claim-achievement",
  authUser,
  UserController.claimAchievement,
);

userRouter.get(
  "/get-user-achievements",
  authUser,
  UserController.getUserAchievements,
);

userRouter.get("/user-tracker", authUser, UserController.getUserTracker);

userRouter.post("/login", bodyValidation(LoginSchema), UserController.login);

userRouter.post(
  "/register",
  bodyValidation(UserRegisterSchema),
  UserController.register,
);

userRouter.post(
  "/forgot-password",
  bodyValidation(ForgotPasswordSchema),
  UserController.forgotPassword,
);

userRouter.post(
  "/reset-password",
  bodyValidation(ResetPasswordSchema),
  UserController.resetPassword,
);

userRouter.get("/settings", authUser, UserController.getUserSettings);

userRouter.get("/get-user-devices", authUser, UserController.getUserDevices);
userRouter.get("/get-user-locks", authUser, UserController.getUserLocks);
userRouter.get("/get-user-rewards", authUser, UserController.getUserRewards);
userRouter.get(
  "/get-user-punishments",
  authUser,
  UserController.getUserPunishments,
);
userRouter.get("/get-user-toys", authUser, UserController.getUserToys);

userRouter.get("/get-user-tickets", authUser, UserController.getUserTickets);
userRouter.post("/add-user-ticket", authUser, UserController.addUserTicket);
userRouter.patch(
  "/toggle-user-ticket-status",
  authUser,
  UserController.toggleTicketStatus,
);

userRouter.get("/profile", authUser, UserController.getProfile);
userRouter.post("/profile", authUser, UserController.updateProfile);

userRouter.post(
  "/user-change-password",
  authUser,
  UserController.userChangePassword,
);

userRouter.post("/user-change-email", authUser, UserController.userChangeEmail);

userRouter.post(
  "/update-profile-picture",
  authUser,
  upload.single("profile_picture"),
  UserController.updateProfilePicture,
);

userRouter.post(
  "/update-avatar-picture",
  authUser,
  upload.single("avatar_picture"),
  UserController.updateAvatarPicture,
);

userRouter.get(
  "/",
  queryValidation(UserSearchSchema),
  authAdmin,
  UserController.getAll,
);

userRouter.get("/products", authUser, UserController.getMyProducts);

userRouter.get("/products/:id", authAdmin, UserController.getUserProducts);

userRouter.get("/diary", authUser, UserController.getDiary);
userRouter.post("/diary", authUser, UserController.addDiaryItem);
userRouter.put("/diary", authUser, UserController.updateDiaryItem);
userRouter.delete("/diary/:id", authUser, UserController.deleteDiaryItem);

userRouter.get("/diary-monthly", authUser, UserController.getDiaryMonthly);

// routes related to in game actions
userRouter.get("/get-user-game", authUser, UserController.getUserGame);
userRouter.post("/add-user-game", authUser, UserController.addUserGame);
userRouter.patch("/cancel-user-game", authUser, UserController.cancelUserGame);

userRouter.post(
  "/products/create",
  authAdmin,
  UserController.createUserProduct,
);

userRouter.delete(
  "/products/:userid/:productid",
  authAdmin,
  UserController.deleteUserProduct,
);

userRouter.get("/active", authAdmin, UserController.getAllActiveCount);

userRouter.get("/:id", authAdmin, UserController.get);

userRouter.post(
  "/create",
  authAdmin,
  bodyValidation(UserRegisterSchema),
  UserController.create,
);

userRouter.post("/activate/:id", authAdmin, UserController.activate);

userRouter.post("/disable/:id", authAdmin, UserController.disable);

userRouter.post(
  "/change-password",
  authAdmin,
  bodyValidation(ChangePasswordSchema),
  UserController.changePassword,
);

userRouter.put(
  "/:id",
  authAdmin,
  bodyValidation(UserUpdateSchema),
  UserController.update,
);

userRouter.post(
  "/update-user-preferences",
  authUser,
  UserController.userUpdatePreferences,
);

userRouter.delete("/:id", authAdmin, UserController.deleteUser);

// user settings form steps
userRouter.post("/userSettings/1", authUser, UserController.userSettings1);
userRouter.post("/userSettings/2", authUser, UserController.userSettings2);
userRouter.post("/userSettings/3", authUser, UserController.userSettings3);
userRouter.post("/userSettings/4", authUser, UserController.userSettings4);
userRouter.post("/userSettings/5", authUser, UserController.userSettings5);
userRouter.post("/userSettings/6", authUser, UserController.userSettings6);
userRouter.post("/userSettings/7", authUser, UserController.userSettings7);
userRouter.post("/userSettings/8", authUser, UserController.userSettings8);
userRouter.post("/userSettings/9", authUser, UserController.userSettings9);
userRouter.post(
  "/userSettings/10",
  authUser,
  upload.single("profile_picture"),
  UserController.userSettings10,
);

userRouter.patch(
  "/userSettings/setState/:state",
  authUser,
  UserController.updateSettingsState,
);

userRouter.post(
  "/userSettings/11",
  authUser,
  upload.single("avatar_picture"),
  UserController.userSettings11,
);

userRouter.post(
  "/generate-wheel-instance",
  authUser,
  UserController.generateWheelInstance,
);

userRouter.get(
  "/wheel-instance/:gameId",
  authUser,
  UserController.getWheelInstance,
);

userRouter.post("/submit-wheel", authUser, UserController.submitWheel);

userRouter.post("/user-wheel-cheated", authUser, UserController.userCheated);

// this means the user cheated in the game, game finished and he submitted that he cheated.
userRouter.post(
  "/submit-cheating-wheel",
  authUser,
  UserController.submitCheatingWheel,
);

// this means the user didn't cheat in the game, game finished and is successful.
userRouter.post("/submit-game", authUser, UserController.submitGame);

userRouter.patch(
  "/toggle-daily-spin",
  authUser,
  UserController.toggleDailySpin,
);

export default userRouter;
