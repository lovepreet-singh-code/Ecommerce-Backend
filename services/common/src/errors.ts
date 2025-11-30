export class ApiError extends Error {
    statusCode: number;

    constructor(statusCode: number, message: string) {
        super(message);
        this.statusCode = statusCode;
        Object.setPrototypeOf(this, ApiError.prototype);
    }
}

export class BadRequestError extends ApiError {
    constructor(message: string) {
        super(400, message);
    }
}

export class NotFoundError extends ApiError {
    constructor(message: string) {
        super(404, message);
    }
}

export class InternalServerError extends ApiError {
    constructor(message: string = 'Internal Server Error') {
        super(500, message);
    }
}
