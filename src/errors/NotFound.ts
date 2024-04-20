import CustomError from "./CustomError";

class NotFound extends CustomError {
    public name: 'NotFoundError'
    public message: string;

    constructor(message: string = '') {
        super('NotFoundError', message);
        this.name = 'NotFoundError';
        this.message = message;
    }
}

export default NotFound