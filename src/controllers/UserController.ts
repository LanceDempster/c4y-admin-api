import { RequestHandler } from "express";
import { LoginType } from "../schemas/Login";
import { UserResgister } from "../schemas/UserResgister";
import UserModel from "../models/UserModel";
import { compare, hash } from "bcrypt";
import { User } from "../interfaces/User";
import { sign, decode } from "jsonwebtoken";
import NotFound from "../errors/NotFound";
import NotAuthorized from "../errors/NotAuthorized";
import { ForgotPassword } from "../schemas/ForgotPassword";
import BadRequest from "../errors/BadRequest";
import { Result } from "../dto/Result";
import { ResetPassword } from "../schemas/ResetPassword";
import { UserSearch, UserSearchSchema } from "../schemas/UserSearch";
import { AccountStatus } from "../enum/AccountStatus";
import { sendMail } from "../utils/email";
import { Token } from "../types/Token";
import { ChangePassword } from "../schemas/changePasswordSchema";
import { UserProductSearch } from "../schemas/UserProductSearch";
import { UserProductFull } from "../interfaces/UserProductFull";
import UserProductModel from "../models/UserProductModel";

export const login: RequestHandler = async (req, res, next) => {
  try {
    const { email, password }: LoginType = req.body;

    const user = await UserModel.getByEmail(email);

    if (!user) return next(new NotFound("There is no user with this email"));

    const checkPass = await compare(password, user.password);

    if (!checkPass) return next(new NotAuthorized("Invalid password"));

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
    const userData = req.body as UserResgister;

    const passwordHash = await hash(userData.password, 10);

    const user = {
      id: 0,
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      country: userData.country,
      dateOfBirth: userData.dateOfBirth,
      gender: userData.gender,
      emailValidation: false,
      accountStatus: "ACTIVE",
      password: passwordHash,
      accountCreateDate: new Date(),
      passwordCreateDate: new Date(),
    };

    const result = await UserModel.create(user as User);

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
        token,
      }),
    );
  } catch (e) {
    next(e);
  }
};

export const create: RequestHandler = async (req, res, next) => {
  try {
    const userData = req.body as UserResgister;

    const passwordHash = await hash(userData.password, 10);

    const user = {
      id: 0,
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      country: userData.country,
      dateOfBirth: userData.dateOfBirth,
      gender: userData.gender,
      emailValidation: false,
      accountStatus: "ACTIVE",
      password: passwordHash,
      accountCreateDate: new Date(),
      passwordCreateDate: new Date(),
    };

    const result = await UserModel.create(user as User);

    return res.status(200).send(
      new Result(true, "User created", {
        id: result.id,
      }),
    );
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

export const getMyProducts: RequestHandler = async (req, res, next) => {
  try {

		const id = req.body.user.id

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

    const result = await UserModel.updateSettings2({id});

    return res.status(200).send(new Result(true, "updated settings to user"));
  } catch (e) {
    next(e);
  }
};


export const userSettings3: RequestHandler = async (req, res, next) => {
  try {
    const id = req.body.user.id;

		const deviceIds = req.body.deviceIds

    const result = await UserModel.updateSettings3({id, deviceIds});

    return res.status(200).send(new Result(true, "updated settings to user"));
  } catch (e) {
    next(e);
  }

}

export const userSettings4: RequestHandler = async (req, res, next) => {
  try {
    const id = req.body.user.id;

		const lockIds = req.body.lockIds

    const result = await UserModel.updateSettings4({id, lockIds});

    return res.status(200).send(new Result(true, "updated settings to user"));
  } catch (e) {
    next(e);
  }

}

export const userSettings5: RequestHandler = async (req, res, next) => {
  try {
    const id = req.body.user.id;

		const rewardsIds = req.body.rewardIds

    const result = await UserModel.updateSettings5({id, rewardsIds});

    return res.status(200).send(new Result(true, "updated settings to user"));
  } catch (e) {
    next(e);
  }

}

export const userSettings6: RequestHandler = async (req, res, next) => {
  try {
    const id = req.body.user.id;

		const punishmentsIds = req.body.punishmentIds

    const result = await UserModel.updateSettings6({id, punishmentsIds});

    return res.status(200).send(new Result(true, "updated settings to user"));
  } catch (e) {
    next(e);
  }

}

export const userSettings7: RequestHandler = async (req, res, next) => {
  try {
    const id = req.body.user.id;

		const toysIds = req.body.toysIds

    const result = await UserModel.updateSettings7({id, toysIds});

    return res.status(200).send(new Result(true, "updated settings to user"));
  } catch (e) {
    next(e);
  }
}

export const userSettings8: RequestHandler = async (req, res, next) => {
  try {
    const id = req.body.user.id;

		const maximum = req.body.maximum
		const minimum = req.body.minimum

    const result = await UserModel.updateSettings8({id, maximum, minimum});

    return res.status(200).send(new Result(true, "updated settings to user"));
  } catch (e) {
    next(e);
  }
}
