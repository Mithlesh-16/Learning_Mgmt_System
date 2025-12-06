class AppError extends Error{
    constructor(message, statusCode){
        super(message);
        this.name = this.constructor.name;
        this.message = message;
        this.statusCode = statusCode;

        if(Error.captureStackTrace){
            Error.captureStackTrace(this, this.constructor);

        }else{
            this.stack = new Error(message).stack;
        }
    }
}

export default AppError;