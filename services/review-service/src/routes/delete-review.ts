import express, { Request, Response } from 'express';
import { NotFoundError, BadRequestError } from '@ecommerce-backend/common';
import { Review } from '../models/review';

const router = express.Router();

router.delete('/api/v1/reviews/:id', async (req: Request, res: Response) => {
    const { id } = req.params;

    // TODO: Check if user is admin via auth middleware
    const isAdmin = req.headers['x-admin'] === 'true';

    if (!isAdmin) {
        throw new BadRequestError('Admin access required');
    }

    const review = await Review.findByIdAndDelete(id);

    if (!review) {
        throw new NotFoundError('Review not found');
    }

    res.status(204).send({});
});

export { router as deleteReviewRouter };
