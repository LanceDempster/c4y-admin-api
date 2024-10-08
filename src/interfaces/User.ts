import { AccountStatus } from "../enum/AccountStatus";
import Base from "./Base";

export interface User extends Base {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  passwordCreateDate: Date;
  country: string;
  productsCount: number;
  dateOfBirth: Date;
  accountStatus: AccountStatus;
  accountCreateDate: Date;
  emailValidation: boolean;
  gender: "MALE" | "FEMALE";
  resetPasswordToken: string;
  timezone: string;
  levelId?: number;
  rankId?: number;
  xpPoints: number;
}
