import { Request, Response, NextFunction } from 'express';
import { ApiError } from '@ecommerce-backend/common';

export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (err instanceof ApiError) {
        return res.status(err.statusCode).send({ errors: [{ message: err.message }] });
    }

    console.error(err);
    res.status(500).send({
        errors: [{ message: 'Something went wrong' }]
    });
};
