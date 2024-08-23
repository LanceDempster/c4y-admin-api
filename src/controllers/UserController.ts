import { RequestHandler } from "express";
import { LoginType } from "../schemas/Login";
import { UserResister } from "../schemas/UserResister";
import UserModel from "../models/UserModel";
import { compare, hash } from "bcrypt";
import { User } from "../interfaces/User";
import { sign, verify } from "jsonwebtoken";
import NotFound from "../errors/NotFound";
import NotAuthorized from "../errors/NotAuthorized";
import { ForgotPassword } from "../schemas/ForgotPassword";
import BadRequest from "../errors/BadRequest";
import { Result } from "../dto/Result";
import { ResetPassword } from "../schemas/ResetPassword";
import { UserSearch } from "../schemas/UserSearch";
import { AccountStatus } from "../enum/AccountStatus";
import { sendMail } from "../utils/email";
import { Token } from "../types/Token";
import { ChangePassword } from "../schemas/changePasswordSchema";
import { UserProductFull } from "../interfaces/UserProductFull";
import UserProductModel from "../models/UserProductModel";
import { DeviceType } from "../interfaces/DeviceType";
import { LockType } from "../interfaces/LockType";
import { Punishment } from "../interfaces/Punishment";
import { Reward } from "../interfaces/Reward";
import { Toy } from "../interfaces/Toy";
import { query } from "../db";
import { DiaryType } from "../interfaces/DiaryType";
import { Ticket } from "../interfaces/Ticket";

export const login: RequestHandler = async (req, res, next) => {
  try {
    const { email, password }: LoginType = req.body;

    const user = await UserModel.getByEmail(email);

    if (!user) return next(new NotFound("Wrong username or password."));

    const checkPass = await compare(password, user.password);

    if (!checkPass)
      return next(new NotAuthorized("Wrong username or password."));

    const token = sign(
      {
        id: user.id,
        createdAt: new Date(),
        role: "USER",
      } as Token,
      process.env.SECRET as string,
    );

    return res.status(200).send(
      new Result(true, "", {
        id: user.id,
        fullName: user.firstName + " " + user.lastName,
        email: user.email,
        gender: user.gender,
        dateOfBirth: user.dateOfBirth,
        timezone: user.timezone,
        token,
      }),
    );
  } catch (e) {
    next(e);
  }
};

export const changePassword: RequestHandler = async (req, res, next) => {
  const userData = req.body as ChangePassword;

  if (userData.password) {
    const passwordHash = await hash(userData.password, 10);

    await UserModel.updateById(userData.userId, {
      password: passwordHash,
      passwordCreateDate: new Date(),
    });

    res
      .status(200)
      .send(new Result(true, "Your password have been changed successfully!"));
  } else {
    return;
  }
};

export const register: RequestHandler = async (req, res, next) => {
  try {
    const userData = req.body as UserResister;

    const passwordHash = await hash(userData.password, 10);

    const user = {
      id: 0,
      firstName: userData.firstName,
      lastName: userData.lastName,
      username: userData.username,
      email: userData.email,
      country: userData.country,
      dateOfBirth: userData.dateOfBirth,
      gender: userData.gender,
      emailValidation: false,
      accountStatus: "ACTIVE",
      password: passwordHash,
      accountCreateDate: new Date(),
      passwordCreateDate: new Date(),
      timezone: userData.timezone,
    };

    let productCode = req.body.productCode;

    const result = await UserModel.create(
      user as User,
      parseInt(productCode),
      next,
    );

    const token = sign(
      {
        id: result.id,
        createdAt: new Date(),
        role: "USER",
      } as Token,
      process.env.SECRET as string,
    );

    return res.status(200).send(
      new Result(true, "", {
        id: result.id,
        fullName: result.firstName + " " + result.lastName,
        email: result.email,
        gender: result.gender,
        dateOfBirth: result.dateOfBirth,
        timezone: user.timezone,
        token,
      }),
    );
  } catch (e) {
    next(e);
  }
};

export const create: RequestHandler = async (req, res, next) => {
  try {
    const userData = req.body as UserResister;

    const passwordHash = await hash(userData.password, 10);

    const user = {
      id: 0,
      firstName: userData.firstName,
      lastName: userData.lastName,
      username: userData.username,
      email: userData.email,
      country: userData.country,
      dateOfBirth: userData.dateOfBirth,
      gender: userData.gender,
      emailValidation: false,
      accountStatus: "ACTIVE",
      password: passwordHash,
      accountCreateDate: new Date(),
      passwordCreateDate: new Date(),
      timezone: userData.timezone,
    };

    return "under development";
    // const result = await UserModel.create(user as User);

    // return res.status(200).send(
    //   new Result(true, "User created", {
    //     id: result.id,
    //   }),
    // );
  } catch (e) {
    next(e);
  }
};

export const addDiaryItem: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.body.user.id;

    const { rows } = await query(
      `SELECT user_product.product_code
             FROM user_product
             WHERE user_product.user_id = ($1)
             limit 1
            `,
      [userId],
    );

    const diaryData = req.body as { title: string; entry: string };

    const diary: DiaryType = {
      createdDate: new Date(),
      title: diaryData.title,
      entry: diaryData.entry,
      type: "u",
      productCode: rows[0].product_code,
      userId: userId,
    };

    const result = await UserModel.addDiary(diary);

    if (result === 1) {
      return res.status(200).send(new Result(true, "Diary created."));
    } else {
      return res
        .status(400)
        .send(new Result(true, "Diary failed try again later."));
    }
  } catch (e) {
    next(e);
  }
};

export const updateDiaryItem: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.body.user.id;

    const diaryData = req.body as {
      title: string;
      entry: string;
      diaryId: string;
    };

    const result = await UserModel.updateDiary(
      diaryData.title,
      diaryData.entry,
      diaryData.diaryId,
      userId,
    );

    if (result === 1) {
      return res.status(200).send(new Result(true, "Diary updated."));
    } else {
      return res.status(400).send(new Result(true, "Diary failed to update."));
    }
  } catch (e) {
    next(e);
  }
};

export const deleteDiaryItem: RequestHandler<{ id: string }> = async (
  req,
  res,
  next,
) => {
  try {
    const { id } = req.params;

    await UserModel.deleteDiary(~~+id);

    return res
      .status(200)
      .send(new Result(true, `Diary with Id:${id} deleted`));
  } catch (e) {
    next(e);
  }
};

export const forgotPassword: RequestHandler = async (req, res, next) => {
  try {
    const { email }: ForgotPassword = req.body;

    const user = await UserModel.getByEmail(email);

    if (!user) return next(new BadRequest("There is no user with this email"));

    const resetPasswordToken = Math.random().toString(36).substring(2, 20);

    const newUser = await UserModel.updateById(user.id, { resetPasswordToken });

    //Send Email with token
    await sendMail(
      "zizo.zoom.z0@gmail.com",
      newUser.email,
      "Reset Password",
      resetPasswordToken,
    );

    return res
      .status(200)
      .send(new Result(true, "Check your email to change your password"));
  } catch (e) {
    next(e);
  }
};

export const resetPassword: RequestHandler = async (req, res, next) => {
  try {
    const { resetPasswordToken, newPassword }: ResetPassword = req.body;

    const user = await UserModel.getOne({ resetPasswordToken });

    if (!user) return next(new NotFound("User not found or invalid token"));

    const newPasswordHash = await hash(newPassword, 10);

    await UserModel.updateById(user.id, {
      password: newPasswordHash,
      resetPasswordToken: "",
      passwordCreateDate: new Date(),
    });

    // fixed a typo in successfully
    res
      .status(200)
      .send(new Result(true, "Your password have been changed successfully!"));
  } catch (e) {
    next(e);
  }
};

// added a new function to filter users by their activity
export const getAllActiveCount: RequestHandler = async (req, res, next) => {
  let data = await UserModel.getTotalActiveUsers();

  res.status(200).send(new Result(true, "", data));
};
export const getAll: RequestHandler = async (req, res, next) => {
  try {
    let query = {};
    Object.assign(query, req.query);
    const {
      firstName,
      lastName,
      email,
      page,
      orderBy,
      orderDirection,
    }: UserSearch = query;

    let [users, count] = await UserModel.search(
      { firstName, lastName, email },
      page,
      orderBy ?? "id",
      orderDirection ?? "asc",
    );

    // if(count === -1) count = await UserModel.count();

    res.status(200).send(
      new Result(
        true,
        count + "",
        users.map((x: User) => {
          return {
            ...x,
            passwordCreateDate: x.passwordCreateDate.toLocaleString(),
            accountCreateDate: x.accountCreateDate.toLocaleString(),
            dateOfBirth: x.dateOfBirth.toLocaleDateString(),
          };
        }),
      ),
    );
  } catch (e) {
    next(e);
  }
};

export const deleteUser: RequestHandler<{ id: string }> = async (
  req,
  res,
  next,
) => {
  try {
    const { id } = req.params;

    const user = await UserModel.getById(~~+id);

    if (!user) return next(new NotFound("No user with this ID"));

    await UserModel.deleteById(user.id);

    return res.status(200).send(new Result(true, `User with Id:${id} deleted`));
  } catch (e) {
    next(e);
  }
};

export const get: RequestHandler<{ id: string }> = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await UserModel.getById(~~+id);

    if (!user) return next(new NotFound("No user with this ID"));

    return res.status(200).send(new Result(true, "", user));
  } catch (e) {
    next(e);
  }
};

export const update: RequestHandler<{ id: string }> = async (
  req,
  res,
  next,
) => {
  try {
    const { id } = req.params;

    const user = await UserModel.getById(~~+id);

    if (!user) return next(new NotFound("No user with this ID"));

    const newUser = await UserModel.updateById(~~+id, req.body);

    return res
      .status(200)
      .send(new Result(true, "User updated successfully", newUser));
  } catch (e) {
    next(e);
  }
};

export const getUserProducts: RequestHandler<{ id: string }> = async (
  req,
  res,
  next,
) => {
  try {
    let query = {};
    Object.assign(query, req.query);
    const { page, orderBy, orderDirection }: any = query;

    const { id } = req.params;

    let [userProducts, count] = await UserModel.getUserProducts(
      parseInt(id),
      page,
      orderBy ?? "id",
      orderDirection ?? "asc",
    );

    // if(count === -1) count = await UserModel.count();

    res.status(200).send(
      new Result(
        true,
        count + "",
        userProducts.map((x: UserProductFull) => {
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

export const getDiary: RequestHandler = async (req, res, next) => {
  try {
    const date: string = req.query.date as string;

    const userId = req.body.user.id;

    let diary = await UserModel.getDiary(date, userId);

    if (diary === undefined) {
      res.status(200).send(new Result(true, "", []));
    } else {
      res.status(200).send(
        new Result(
          true,
          "",
          diary.map((x: any) => {
            return {
              ...x,
            };
          }),
        ),
      );
    }
  } catch (e) {
    next(e);
  }
};

export const getUserToys: RequestHandler<{ id: string }> = async (
  req,
  res,
  next,
) => {
  try {
    let query = {};
    Object.assign(query, req.query);

    const id = req.body.user.id;

    let userToys = await UserModel.getUserToys(id);

    // if(count === -1) count = await UserModel.count();

    if (userToys === undefined) {
      res.status(200).send(new Result(true, "User has no toys"));
    } else {
      res.status(200).send(
        new Result(
          true,
          "",
          userToys.map((x: Toy) => {
            return {
              ...x,
            };
          }),
        ),
      );
    }
  } catch (e) {
    next(e);
  }
};

export const getUserPunishments: RequestHandler<{ id: string }> = async (
  req,
  res,
  next,
) => {
  try {
    let query = {};
    Object.assign(query, req.query);

    const id = req.body.user.id;

    let userPunishments = await UserModel.getUserPunishments(id);

    // if(count === -1) count = await UserModel.count();

    if (userPunishments === undefined) {
      res.status(200).send(new Result(true, "User has no punishments"));
    } else {
      res.status(200).send(
        new Result(
          true,
          "",
          userPunishments.map((x: Punishment) => {
            return {
              ...x,
            };
          }),
        ),
      );
    }
  } catch (e) {
    next(e);
  }
};

export const getUserRewards: RequestHandler<{ id: string }> = async (
  req,
  res,
  next,
) => {
  try {
    let query = {};
    Object.assign(query, req.query);

    const id = req.body.user.id;

    let userRewards = await UserModel.getUserRewards(id);

    // if(count === -1) count = await UserModel.count();

    if (userRewards === undefined) {
      res.status(200).send(new Result(true, "User has no rewards"));
    } else {
      res.status(200).send(
        new Result(
          true,
          "",
          userRewards.map((x: Reward) => {
            return {
              ...x,
            };
          }),
        ),
      );
    }
  } catch (e) {
    next(e);
  }
};

export const getUserLocks: RequestHandler<{ id: string }> = async (
  req,
  res,
  next,
) => {
  try {
    let query = {};
    Object.assign(query, req.query);

    const id = req.body.user.id;

    let userLocks = await UserModel.getUserLocks(id);

    // if(count === -1) count = await UserModel.count();

    if (userLocks === undefined) {
      res.status(200).send(new Result(true, "User has no locks"));
    } else {
      res.status(200).send(
        new Result(
          true,
          "",
          userLocks.map((x: LockType) => {
            return {
              ...x,
            };
          }),
        ),
      );
    }
  } catch (e) {
    next(e);
  }
};

export const getUserDevices: RequestHandler<{ id: string }> = async (
  req,
  res,
  next,
) => {
  try {
    let query = {};
    Object.assign(query, req.query);

    const id = req.body.user.id;

    let userDevices = await UserModel.getUserDevices(id);

    // if(count === -1) count = await UserModel.count();

    if (userDevices === undefined) {
      res.status(200).send(new Result(true, "User has no devices"));
    } else {
      res.status(200).send(
        new Result(
          true,
          "",
          userDevices.map((x: DeviceType) => {
            return {
              ...x,
            };
          }),
        ),
      );
    }
  } catch (e) {
    next(e);
  }
};

export const getUserTickets: RequestHandler<{ id: string }> = async (
  req,
  res,
  next,
) => {
  try {
    let query = {};
    Object.assign(query, req.query);

    const id = req.body.user.id;

    let userTickets = await UserModel.getUserTickets(id);

    // if(count === -1) count = await UserModel.count();

    if (userTickets === undefined) {
      res.status(200).send(new Result(true, "User has no tickets"));
    } else {
      res.status(200).send(
        new Result(
          true,
          "",
          userTickets.map((x: Ticket) => {
            return {
              ...x,
            };
          }),
        ),
      );
    }
  } catch (e) {
    next(e);
  }
};

export const getMyProducts: RequestHandler = async (req, res, next) => {
  try {
    const id = req.body.user.id;

    let [userProducts, count] = await UserModel.getUserProducts(
      id,
      0,
      "id",
      "asc",
    );

    // if(count === -1) count = await UserModel.count();

    res.status(200).send(
      new Result(
        true,
        count + "",
        userProducts.map((x: UserProductFull) => {
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

export const userUpdatePreferences: RequestHandler = async (req, res, next) => {
  try {
    const id = req.body.user.id;

    const userSettings1Data = { ...req.body, id: id } as {
      community: boolean;
      gameMessages: boolean;
      marketingMessages: boolean;
      keyHolder: boolean;
      userStories: boolean;
      id: number;
    };

    const result = await UserModel.updateSettings1v2(userSettings1Data);

    return res.status(200).send(new Result(true, "updated settings to user"));
  } catch (e) {
    next(e);
  }
};

export const createUserProduct: RequestHandler = async (req, res, next) => {
  try {
    const userProductData = req.body as { userId: number; productCode: number };

    const result = await UserProductModel.create(
      userProductData.userId,
      userProductData.productCode,
    );

    return res.status(200).send(
      new Result(true, "Added product to user", {
        id: result.id,
      }),
    );
  } catch (e) {
    next(e);
  }
};

export const deleteUserProduct: RequestHandler<{
  userid: string;
  productid: string;
}> = async (req, res, next) => {
  try {
    const { userid, productid } = req.params;

    const userProduct = await UserProductModel.getById(~~+userid, ~~+productid);

    if (!userProduct) return next(new NotFound("No user product with this ID"));

    await UserProductModel.deleteById(~~+userid, ~~+productid);

    return res
      .status(200)
      .send(new Result(true, `User product with Id:${productid} deleted`));
  } catch (e) {
    next(e);
  }
};

export const activate: RequestHandler<{ id: string }> = async (
  req,
  res,
  next,
) => {
  try {
    const { id } = req.params;

    const user = await UserModel.getById(~~+id);

    if (!user) return next(new NotFound("No user with this ID"));

    const newUser = await UserModel.updateById(~~+id, {
      accountStatus: AccountStatus.ACTIVE,
    });

    return res
      .status(200)
      .send(new Result(true, "User disabled successfully", newUser));
  } catch (e) {
    next(e);
  }
};

export const disable: RequestHandler<{ id: string }> = async (
  req,
  res,
  next,
) => {
  try {
    const { id } = req.params;

    const user = await UserModel.getById(~~+id);

    if (!user) return next(new NotFound("No user with this ID"));

    const newUser = await UserModel.updateById(~~+id, {
      accountStatus: AccountStatus.DISABLED,
    });

    return res
      .status(200)
      .send(new Result(true, "User disabled successfully", newUser));
  } catch (e) {
    next(e);
  }
};

export const getProfile: RequestHandler<{ id: string }> = async (
  req,
  res,
  next,
) => {
  try {
    return res.status(200).send(new Result(true, "", req.body.user));
  } catch (e) {
    next(e);
  }
};

export const updateProfilePicture: RequestHandler = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return next(new NotAuthorized("Unauthorized"));
    }

    const decoded: Token = verify(token, process.env.SECRET as string) as any;

    const user = await UserModel.getById(decoded.id);

    if (!user || decoded.role !== "USER") {
      return next(new NotAuthorized("Invalid token"));
    }

    const id = user.id;

    // @ts-ignore
    const fileLocation = req?.file?.location;

    // @ts-ignore
    const result = await UserModel.updateProfilePicture({ id, fileLocation });

    return res
      .status(200)
      .send(new Result(true, "updated user profile picture."));
  } catch (e) {
    next(e);
  }
};

export const updateAvatarPicture: RequestHandler = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return next(new NotAuthorized("Unauthorized"));
    }

    const decoded: Token = verify(token, process.env.SECRET as string) as any;

    const user = await UserModel.getById(decoded.id);

    if (!user || decoded.role !== "USER") {
      return next(new NotAuthorized("Invalid token"));
    }

    const id = user.id;

    // @ts-ignore
    const fileLocation = req?.file?.location;

    // @ts-ignore
    const result = await UserModel.updateAvatarPicture({ id, fileLocation });

    return res
      .status(200)
      .send(new Result(true, "updated user profile picture."));
  } catch (e) {
    next(e);
  }
};

export const updateProfile: RequestHandler = async (req, res, next) => {
  try {
    const id = req.body.user.id;

    const { firstName, lastName, gender, dateOfBirth, timezone, country } =
      req.body;

    UserModel.updateUserProfile({
      id,
      firstName,
      lastName,
      gender,
      dateOfBirth,
      timezone,
      country,
    });

    return res.status(200).send(new Result(true, "updated profile to user"));
  } catch (e) {
    next(e);
  }
};

export const getUserSettings: RequestHandler = async (req, res, next) => {
  try {
    let userSettings = await UserModel.getSettings(req.body.user.id);

    return res.status(200).send(JSON.stringify(userSettings));
  } catch (e) {
    next(e);
  }
};

// user settings form steps
export const userSettings1: RequestHandler = async (req, res, next) => {
  try {
    const id = req.body.user.id;

    const userSettings1Data = { ...req.body, id: id } as {
      community: boolean;
      gameMessages: boolean;
      marketingMessages: boolean;
      keyHolder: boolean;
      userStories: boolean;
      id: number;
    };

    const result = await UserModel.updateSettings1(userSettings1Data);

    return res.status(200).send(new Result(true, "updated settings to user"));
  } catch (e) {
    next(e);
  }
};

export const userSettings2: RequestHandler = async (req, res, next) => {
  try {
    const id = req.body.user.id;

    const result = await UserModel.updateSettings2({ id });

    return res.status(200).send(new Result(true, "updated settings to user"));
  } catch (e) {
    next(e);
  }
};

export const userSettings3: RequestHandler = async (req, res, next) => {
  try {
    const id = req.body.user.id;

    const deviceIds = req.body.deviceIds;

    const result = await UserModel.updateSettings3({ id, deviceIds });

    return res.status(200).send(new Result(true, "updated settings to user"));
  } catch (e) {
    next(e);
  }
};

export const userSettings4: RequestHandler = async (req, res, next) => {
  try {
    const id = req.body.user.id;

    const lockIds = req.body.lockIds;

    const result = await UserModel.updateSettings4({ id, lockIds });

    return res.status(200).send(new Result(true, "updated settings to user"));
  } catch (e) {
    next(e);
  }
};

export const userSettings5: RequestHandler = async (req, res, next) => {
  try {
    const id = req.body.user.id;

    const rewardsIds = req.body.rewardIds;

    const result = await UserModel.updateSettings5({ id, rewardsIds });

    return res.status(200).send(new Result(true, "updated settings to user"));
  } catch (e) {
    next(e);
  }
};

export const userSettings6: RequestHandler = async (req, res, next) => {
  try {
    const id = req.body.user.id;

    const punishmentsIds = req.body.punishmentIds;

    const result = await UserModel.updateSettings6({ id, punishmentsIds });

    return res.status(200).send(new Result(true, "updated settings to user"));
  } catch (e) {
    next(e);
  }
};

export const userSettings7: RequestHandler = async (req, res, next) => {
  try {
    const id = req.body.user.id;

    const toysIds = req.body.toysIds;

    const result = await UserModel.updateSettings7({ id, toysIds });

    return res.status(200).send(new Result(true, "updated settings to user"));
  } catch (e) {
    next(e);
  }
};

export const userSettings8: RequestHandler = async (req, res, next) => {
  try {
    const id = req.body.user.id;

    const maximum = req.body.maximum;
    const minimum = req.body.minimum;

    const result = await UserModel.updateSettings8({ id, maximum, minimum });

    return res.status(200).send(new Result(true, "updated settings to user"));
  } catch (e) {
    next(e);
  }
};

export const userSettings9: RequestHandler = async (req, res, next) => {
  try {
    const id = req.body.user.id;

    const keyStorage = req.body.keyStorageId;

    const result = await UserModel.updateSettings9({ id, keyStorage });

    return res.status(200).send(new Result(true, "updated settings to user"));
  } catch (e) {
    next(e);
  }
};

export const userSettings10: RequestHandler = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return next(new NotAuthorized("Unauthorized"));
    }

    const decoded: Token = verify(token, process.env.SECRET as string) as any;

    const user = await UserModel.getById(decoded.id);

    if (!user || decoded.role !== "USER") {
      return next(new NotAuthorized("Invalid token"));
    }

    const id = user.id;

    // @ts-ignore
    const fileLocation = req?.file?.location;

    // @ts-ignore
    const result = await UserModel.updateSettings10({ id, fileLocation });

    return res.status(200).send(new Result(true, "updated settings to user"));
  } catch (e) {
    next(e);
  }
};

export const userSettings11: RequestHandler = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return next(new NotAuthorized("Unauthorized"));
    }

    const decoded: Token = verify(token, process.env.SECRET as string) as any;

    const user = await UserModel.getById(decoded.id);

    if (!user || decoded.role !== "USER") {
      return next(new NotAuthorized("Invalid token"));
    }

    const id = user.id;

    // @ts-ignore
    const fileLocation = req?.file?.location;

    // @ts-ignore
    const result = await UserModel.updateSettings11({ id, fileLocation });

    return res.status(200).send(new Result(true, "updated settings to user"));
  } catch (e) {
    next(e);
  }
};

export const userChangePassword: RequestHandler = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return next(new NotAuthorized("Unauthorized"));
    }

    const decoded: Token = verify(token, process.env.SECRET as string) as any;

    const user = await UserModel.getById(decoded.id);

    if (!user || decoded.role !== "USER") {
      return next(new NotAuthorized("Invalid token"));
    }

    const oldPassword = req.body.oldPassword;
    const newPassword = req.body.newPassword;
    const id = user.id;

    const result = await UserModel.userChangePassword({
      id,
      oldPassword,
      newPassword,
    });

    return res.status(200).send(new Result(true, "updated settings to user"));
  } catch (e) {
    next(e);
  }
};

export const userChangeEmail: RequestHandler = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return next(new NotAuthorized("Unauthorized"));
    }

    const decoded: Token = verify(token, process.env.SECRET as string) as any;

    const user = await UserModel.getById(decoded.id);

    if (!user || decoded.role !== "USER") {
      return next(new NotAuthorized("Invalid token"));
    }

    const newEmail = req.body.newEmail;
    const id = user.id;

    const result = await UserModel.userChangeEmail({ id, newEmail });

    return res.status(200).send(new Result(true, "updated settings to user"));
  } catch (e) {
    next(e);
  }
};

export const addUserTicket: RequestHandler = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return next(new NotAuthorized("Unauthorized"));
    }

    const decoded: Token = verify(token, process.env.SECRET as string) as any;

    const user = await UserModel.getById(decoded.id);

    if (!user || decoded.role !== "USER") {
      return next(new NotAuthorized("Invalid token"));
    }

    const id = user.id;
    const email = user.email;

    let { title, description, categoryId } = req.body;

    // @ts-ignore
    const result = await UserModel.addTicket(
      id,
      email,
      title,
      description,
      categoryId,
    );

    return res.status(200).send(new Result(true, "Updated ticket to user"));
  } catch (e) {
    next(e);
  }
};

export const toggleTicketStatus: RequestHandler = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return next(new NotAuthorized("Unauthorized"));
    }

    const userId = req.body.user.id;

    const { ticketId } = req.body;

    // @ts-ignore
    const result = await UserModel.toggleStatus({ userId, ticketId });

    return res.status(200).send(new Result(true, "Updated ticket to user"));
  } catch (e) {
    next(e);
  }
};

export const getUserGame: RequestHandler = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return next(new NotAuthorized("Unauthorized"));
    }

    const userId = req.body.user.id;

    const result = await UserModel.getUserGames({ userId });

    return res.status(200).send(new Result(true, "Added running game", result));
  } catch (e) {
    next(e);
  }
};

export const addUserGame: RequestHandler = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return next(new NotAuthorized("Unauthorized"));
    }

    const decoded: Token = verify(token, process.env.SECRET as string) as any;

    const user = await UserModel.getById(decoded.id);

    if (!user || decoded.role !== "USER") {
      return next(new NotAuthorized("Invalid token"));
    }

    const id = user.id;
    const { seconds, minimumWheelPercentage, maximumWheelPercentage } =
      req.body;

    const result = await UserModel.addUserGame({
      userId: id,
      seconds,
      minimumWheelPercentage,
      maximumWheelPercentage,
    });

    return res.status(200).send(new Result(true, "Game started"));
  } catch (e) {
    next(e);
  }
};

export const cancelUserGame: RequestHandler = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return next(new NotAuthorized("Unauthorized"));
    }

    const decoded: Token = verify(token, process.env.SECRET as string) as any;

    const user = await UserModel.getById(decoded.id);

    if (!user || decoded.role !== "USER") {
      return next(new NotAuthorized("Invalid token"));
    }

    const id = user.id;
    const gameId = req.body.gameId;

    const result = await UserModel.cancelUserGame({ userId: id, gameId });

    return res.status(200).send(new Result(true, "Game canceled"));
  } catch (e) {
    next(e);
  }
};

export const generateWheelInstance: RequestHandler = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return next(new NotAuthorized("Unauthorized"));
    }

    const decoded: Token = verify(token, process.env.SECRET as string) as any;

    const user = await UserModel.getById(decoded.id);

    if (!user || decoded.role !== "USER") {
      return next(new NotAuthorized("Invalid token"));
    }

    const userId = user.id;
    const gameId = req.body.gameId;
    const type = req.body.type;
    const size = req.body.size;

    const result = await UserModel.generateWheelInstance({
      gameId,
      type,
      userId,
      size,
    });

    return res.status(200).send(new Result(true, "Game wheel instance."));
  } catch (e) {
    next(e);
  }
};

export const getWheelInstance: RequestHandler = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return next(new NotAuthorized("Unauthorized"));
    }

    const decoded: Token = verify(token, process.env.SECRET as string) as any;

    const user = await UserModel.getById(decoded.id);

    if (!user || decoded.role !== "USER") {
      return next(new NotAuthorized("Invalid token"));
    }

    const { gameId } = req.params;

    const result = await UserModel.getWheelInstance({ gameId });

    return res.status(200).send(new Result(true, "Wheel instance", result));
  } catch (e) {
    next(e);
  }
};

export const submitWheel: RequestHandler = async (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return next(new NotAuthorized("Unauthorized"));
  }

  const decoded: Token = verify(token, process.env.SECRET as string) as any;

  const user = await UserModel.getById(decoded.id);

  if (!user || decoded.role !== "USER") {
    return next(new NotAuthorized("Invalid token"));
  }

  const { gameId, type, itemName, accepted } = req.body;

  const result = await UserModel.submitWheel({
    gameId,
    itemName,
    type: type,
    accepted: accepted === "1",
    userId: user.id,
  });

  return res.status(200).send(new Result(true, "Wheel instance", result));
};

export const userCheated: RequestHandler = async (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return next(new NotAuthorized("Unauthorized"));
  }

  const decoded: Token = verify(token, process.env.SECRET as string) as any;

  const user = await UserModel.getById(decoded.id);

  if (!user || decoded.role !== "USER") {
    return next(new NotAuthorized("Invalid token"));
  }

  const { gameId } = req.body;

  const result = await UserModel.userCheated({
    userId: user.id,
    gameId,
  });

  return res.status(200).send(new Result(true, "Don't cheat", result));
};

export const submitCheatingWheel: RequestHandler = async (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return next(new NotAuthorized("Unauthorized"));
  }

  const decoded: Token = verify(token, process.env.SECRET as string) as any;

  const user = await UserModel.getById(decoded.id);

  if (!user || decoded.role !== "USER") {
    return next(new NotAuthorized("Invalid token"));
  }

  const { cheaterWheelId, gameId, itemName, accepted } = req.body;

  const result = await UserModel.submitCheatingWheel({
    gameId,
    cheaterWheelId,
    itemName,
    accepted: accepted === "1",
    userId: user.id,
  });

  return res.status(200).send(new Result(true, "Wheel instance", result));
};

export const submitGame: RequestHandler = async (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return next(new NotAuthorized("Unauthorized"));
  }

  const decoded: Token = verify(token, process.env.SECRET as string) as any;

  const user = await UserModel.getById(decoded.id);

  if (!user || decoded.role !== "USER") {
    return next(new NotAuthorized("Invalid token"));
  }

  const { gameId, acceptedExtraTime } = req.body;

  const result = await UserModel.submitGame({
    gameId,
    userId: user.id,
    acceptedExtraTime,
  });

  return res.status(200).send(new Result(true, "Game submitted", result));
};

export const toggleDailySpin: RequestHandler = async (req, res, next) => {
  const { gameId, dailySpin } = req.body;

  const result = await UserModel.toggleDailySpin({
    dailySpin: dailySpin === "1",
    gameId,
    userId: req.body.user.id,
  });

  return res.status(200).send(new Result(true, "Daily spin toggled", result));
};

export const updateSettingsState: RequestHandler = async (req, res, next) => {
  const { state } = req.params;

  const result = await UserModel.updateUserSettingsState(
    req.body.user.id,
    parseInt(state),
  );

  return res.status(200).send(new Result(true, "Updated settingState", result));
};

export const getDiaryMonthly: RequestHandler = async (req, res, next) => {
  const { month } = req.params;

  let userId = req.body.user.id;

  const result = await UserModel.diaryMontly(userId);

  return res.status(200).send(new Result(true, "Updated settingState", result));
};

export const getUserTracker: RequestHandler = async (req, res, next) => {
  let userId = req.body.user.id;

  const result = await UserModel.getUserTracker(userId);

  return res.status(200).send(new Result(true, "Get user tracker", result));
};

export const getUserAchievements: RequestHandler = async (req, res, next) => {
  let userId = req.body.user.id;

  const result = await UserModel.getUserAchievements(userId);

  return res
    .status(200)
    .send(new Result(true, "Get user achievements", result));
};
