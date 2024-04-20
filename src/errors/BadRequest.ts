import CustomError from "./CustomError";

class BadRequest extends CustomError {
    public name: 'BadRequestError'
    public message: string;
    public validations: string[];

    constructor(message: string = '', validations: string[] = []) {
        super('BadRequestError', message )
        this.name = 'BadRequestError'
        this.message = message
        this.validations = validations
    }
}

export default BadRequest