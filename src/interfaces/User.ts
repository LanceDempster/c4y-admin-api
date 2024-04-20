import { AccountStatus } from "../enum/AccountStatus";
import Base from "./Base";

export interface User extends Base {

    firstName: string,
    lastName: string,
    email: string,
    password: string,
    passwordCreateDate: Date,
    country: string,
    dateOfBirth: Date,
    accountStatus: AccountStatus,
    accountCreateDate: Date,
    emailValidation: boolean,
    gender: 'MALE' | 'FEMALE',
    resetPasswordToken: string

}