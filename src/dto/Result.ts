interface IResult {
    data: any,
    message: string,
    status: boolean,
    responseTime: Date
}

export class Result implements IResult {

    data: any;
    message: string;
    status: boolean;
    responseTime: Date;

    constructor(status: boolean, message: string, data?:any) {
        this.data = data;
        this.message = message;
        this.status = status;
        this.responseTime = new Date();
    }
}