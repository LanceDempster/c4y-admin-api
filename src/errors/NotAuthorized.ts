import CustomError from "./CustomError";

class NotAuthorized extends CustomError {
    public name: 'NotAuthorized'
    public message: string;

    constructor(message: string = '') {
        super('NotAuthorized', message)
        this.name = 'NotAuthorized'
        this.message = message
    }
}

export default NotAuthorized