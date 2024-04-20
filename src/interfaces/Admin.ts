import { AccountStatus } from "../enum/AccountStatus";
import Base from "./Base";

export interface Admin extends Base {

    firstName: string,
    lastName: string,
    email: string,
    password: string,
    passwordCreateDate: Date,
    accountStatus: AccountStatus,
    accountCreateDate: Date,
    resetPasswordToken: string
    
}