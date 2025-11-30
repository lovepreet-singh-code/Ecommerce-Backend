import { Request, Response, NextFunction } from 'express';
import { ApiError } from '@ecommerce-backend/common';

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    // TODO: Implement JWT verification
    // For now, just pass through or simulate auth
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        // return next(new ApiError(401, 'Unauthorized'));
    }

    next();
};
